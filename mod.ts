/**
 * @module entrypoint
 * @example
 *  ```ts
 * const hello = Template.new`Hello ${Template.str("Template")}!`;
 *
 * const profile = Template.new`\
 * Name: ${Template.str()}
 * Age: ${Template.num()}
 * Gender: ${Template.tuple(["男性","女性","その他","無回答"])}
 * Role: ${Template.record({
 *    admin:"管理者",
 *     stuff:"スタッフ",
 *     moderator:"モデレーター",
 *     member:"メンバー"
 * })}
 * Rank: ${Template.cond("プレミアム","一般")}ユーザー
 * Log:
 * ${Template.lines()}
 * `;
 * profile.compile("Alice",18,1,"admin",true,[]);
 * const compile = profile.prepare("name","age","gender","role","isPremium","logs");
 *
 * compile({
 *   name:"Alice",
 *   age:18,
 *   gender:1,
 *   role:"admin",
 *   isPemium:true,
 *   logs:[]
 * })
 * ```
 */

/**
 * テンプレートを作成する
 *  @example
 *  ```ts
 * const hello = Template.new`Hello ${Template.str("Template")}!`;
 *
 * const profile = Template.new`\
 * Name: ${Template.str()}
 * Age: ${Template.num()}
 * Gender: ${Template.tuple(["男性","女性","その他","無回答"])}
 * Role: ${Template.record({
 *    admin:"管理者",
 *     stuff:"スタッフ",
 *     moderator:"モデレーター",
 *     member:"メンバー"
 * })}
 * Rank: ${Template.cond("プレミアム","一般")}ユーザー
 * Log:
 * ${Template.lines()}
 * `;
 * profile.compile("Alice",18,1,"admin",true,[]);
 * const compile = profile.prepare("name","age","gender","role","isPremium","logs");
 *
 * compile({
 *   name:"Alice",
 *   age:18,
 *   gender:1,
 *   role:"admin",
 *   isPemium:true,
 *   logs:[]
 * })
 * ```
 */
export class Template<T extends Placeholder[]> {
	private base: readonly string[];
	private placeholders: Placeholder[];
	/**
	 * Do not use. Use {@link Template.new} instead
	 * @hideconstructor
	 * @private
	 */
	private constructor(base: readonly string[], placeholders: T) {
		this.base = base;
		this.placeholders = placeholders;
	}
	/**
	 * テンプレートを新しく作成します
	 * @param strings テンプレートリテラルによって呼び出すべきです
	 * @param args テンプレートリテラルによって呼び出すべきです
	 * @description 新しくテンプレートを生成します。
	 * @example
	 * ```ts
	 * Template.new`Hello ${Template.str("Template!")}`
	 * ```
	 */
	static new<
		const T extends (Placeholder | StringLike)[],
		// 見やすくするためのハック
		const _ extends PickTuple<T, Placeholder> = PickTuple<T, Placeholder>,
	>(strings: TemplateStringsArray, ...args: T): Template<_> {
		const new_strings: string[] = [];
		const new_args: Placeholder[] = [];
		for (const [i, str] of strings.entries()) {
			if (args.length > i) {
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				const placeholderOrStrLike = args[i]!;
				if ("kind" in Object(placeholderOrStrLike)) {
					new_strings.push(str);
					new_args.push(placeholderOrStrLike as Placeholder);
				} else {
					const str2 = placeholderOrStrLike.toString();
					new_strings.push(str + str2);
				}
			} else {
				new_strings.push(str);
			}
		}
		console.log(new_strings, new_args);
		return new Template(new_strings, new_args);
	}
	/**
	 * プレースホルダを埋めて文字列を構築
	 * @param args Templateを生成したときの引数を順番に指定する。デフォルト値が指定されている場合、nullかundefinedによってそれを使用する
	 * @returns 構築された文字列
	 * @example
	 * ```ts
	 * const template = Template.new`foo: ${Template.str()} bar: ${Template.num(42)} baz: ${Template.cond("a","b")}`;
	 *
	 * template.compile("hoge",123,true);
	 * // デフォルト値を使う
	 * template.compile("hoge",null,true);
	 * ```
	 */
	public compile(...args: PlaceholderParamaters<T>): string {
		let result = "";
		for (const [i, part] of this.base.entries()) {
			result += part;
			if (this.placeholders.length > i) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				const placeholder = this.placeholders[i]!;
				const placeholderValue =
					placeholder.kind === "exec"
						? placeholder.compile(args[i])
						: (args[i] as StringLike | (null | undefined)) ??
							placeholder.default;
				if (placeholderValue) {
					result += placeholderValue.toString();
				} else {
					throw new Error("プレースホルダーに指定されてる値がなんかやばいです");
				}
			}
		}
		return result;
	}
	//
	// [string,string]みたいなのを["a","b"]と合わせて{ a:string,b:string }みたいな形にして使える関数
	//
	//
	/**
	 * テンプレートを構造的に使用できるようにする
	 * @param keys プレースホルダに順番に名前を付ける。重複も可
	 * @returns 構造を渡すことでテンプレートを文字列に変換する関数
	 * @example
	 * ```ts
	 * const compile = Template.new`
	 * A: ${Template.str()}
	 * B: ${Template.str()}
	 * A: ${Template.str()}
	 * B: ${Template.str()}
	 * `.prepare("a","b","a","b");
	 *
	 * const text = compile({
	 * 	a:"foo",
	 * 	b:"bar"
	 * })
	 * ```
	 */
	public prepare<const U extends Filled<PlaceholderParamaters<T>, string>>(
		...keys: U
	): (
		valuemap: Mapping<PlaceholderParamaters<T>, U> extends infer Flatten
			? { [x in keyof Flatten]: Flatten[x] }
			: never,
	) => string {
		return (valuemap) => {
			return this.compile(
				...(keys.map(
					(key) => valuemap[key as keyof typeof valuemap],
				) as PlaceholderParamaters<T>),
			);
		};
	}
	/**
	 * 包括的にStringLikeなオブジェクトを受け入れるプレースホルダを作成する
	 * @versatile
	 * @template T 受け入れる値の型
	 * @param defaultValue 指定した場合、構築時に省略可能
	 */
	static primitive<T extends StringLike>(
		this: void,
		defaultValue: T,
	): Prim<T, true>;
	/**
	 * 包括的にStringLikeなオブジェクトを受け入れるプレースホルダを作成する(デフォルト値なし)
	 * @versatile
	 * @template T 受け入れる値の型
	 * @param defaultValue
	 */
	static primitive<T extends StringLike>(
		this: void,
		defaultValue?: undefined,
	): Prim<T, false>;
	/**
	 * 包括的にStringLikeなオブジェクトを受け入れるプレースホルダを作成する(デフォルト値の存在不明)
	 * @versatile
	 * @template T 受け入れる値の型
	 * @param defaultValue
	 */
	static primitive<T extends StringLike>(
		this: void,
		defaultValue: T | undefined,
	): Prim<T, boolean>;
	static primitive<T extends StringLike>(
		this: void,
		defaultValue?: T | undefined,
	): Prim<T, boolean> {
		if (defaultValue) {
			return { kind: "primitive", default: defaultValue };
		}
		return { kind: "primitive", default: null };
	}
	/**
	 * 文字列を受け入れるプレースホルダを作成する
	 * @template T より詳細な型が必要なとき
	 * @param defaultValue 指定した場合、構築時に省略可能
	 * @example
	 * ```ts
	 * const template = Template.new`こんにちは、${Template.str()}さん！`
	 *
	 * template.compile("太郎") // こんにちは、太郎さん！
	 * ```
	 */
	static str<T extends string = string>(
		this: void,
		defaultValue: NoInfer<T>,
	): Prim<T, true>;
	/**
	 * デフォルト値なし
	 */
	static str<T extends string = string>(
		this: void,
		defaultValue?: undefined,
	): Prim<T, false>;
	/**
	 * デフォルト値の存在不明
	 */
	static str<T extends string = string>(
		this: void,
		defaultValue: NoInfer<T> | undefined,
	): Prim<T, boolean>;
	static str(this: void, defaultValue?: string | undefined): Prim<string> {
		return Template.primitive<string>(defaultValue);
	}
	/**
	 * 数字を受け入れるプレースホルダを作成する
	 * @template T より詳細な型が必要なとき
	 * @param defaultValue 指定した場合、構築時に省略可能
	 * @example
	 * ```ts
	 * const template = Template.new`スコア: ${Template.num()}点`;
	 *
	 * template.compile(100) // スコア: 100点
	 * ```
	 */
	static num<T extends number = number>(
		this: void,
		defaultValue: NoInfer<T>,
	): Prim<T, true>;
	/**
	 * デフォルト値なし
	 */
	static num<T extends number = number>(
		this: void,
		defaultValue?: undefined,
	): Prim<T, false>;
	/**
	 * デフォルト値の存在不明
	 */
	static num<T extends number = number>(
		this: void,
		defaultValue: T | undefined,
	): Prim<T, boolean>;
	static num(this: void, defaultValue?: number | undefined): Prim<number> {
		return Template.primitive<number>(defaultValue);
	}
	/**
	 * 構築時に任意の型の値を受け取る関数プレースホルダを作成する
	 * @versatile
	 * @template T 関数が受け入れる引数の型
	 * @param compile 構築時に実行される関数
	 * @example
	 * ```ts
	 * const dateplaceHolder = Template.callback((date:Date) => {
	 *    return date.toLocaleString()
	 * })
	 * const template = Template.new`今日は${dateplaceHolder}`
	 * template.compile(new Date) // 今日はyyyy/mm/dd hh:mm:ss
	 * ```
	 */
	static callback<const T>(this: void, compile: (value: T) => string): Exec<T> {
		return {
			kind: "exec",
			compile,
		};
	}
	/**
	 * 構築時に真偽値を受け取りどちらかを使用するプレースホルダを作成する
	 * @param a trueの時に使われる値
	 * @param b falseの時に使われる値
	 * @example
	 * ```ts
	 * const template = Template.new`コイントス: ${Template.cond("表","裏")}`;
	 *
	 * template.compile(Math.random() > 0.5) // コイントス: 表 | コイントス: 裏
	 * ```
	 */
	static cond(this: void, a: string, b: string): Exec<boolean> {
		return {
			kind: "exec",
			compile(bool) {
				return bool ? a : b;
			},
		};
	}
	/**
	 * 構築時に配列のindexを受け取るプレースホルダを作成する
	 * @param array 配列オブジェクト
	 * @param fallback 構築時に範囲外へアクセスした時のデフォルト値({@link array}が固定長配列ではない場合のみ)
	 * @example
	 * ```ts
	 * const people = ["Alice","Bob","Charlie","Dave","Ellen"] as const;
	 * const template = `本日の主役は${Template.tuple(people)}さん`
	 *
	 * template.compile(2) // 本日の主役はCharlieさん
	 * ```
	 */
	static tuple<const T extends readonly string[]>(
		this: void,
		array: T,
		...fallback: IsTuple<T> extends true ? [] : [fallback: string]
	): Exec<ArrayKeys<T>> {
		return {
			kind: "exec",
			compile(index) {
				// タプルならindexが範囲外になることはない。ベクタならfallbackが要求されるのでfallbackは必ずstring
				// TypeScriptのコンパイラはそんなに賢くないのでfallbackが必ずstringなのはわからないのでアサーション
				return array[index] ?? (fallback[0] as string);
			},
		};
	}
	/**
	 * 構築時にキーを受け取りそのキーの値を使用するプレースホルダを作成する
	 * @template T 受け取るキー
	 * @param record マップされた値
	 * @example
	 * ```ts
	 * const template = Template.new`今日の天気は${Template.record({ sunny:"晴れ",cloudy:"曇り",rainy:"雨" })}です`;

	 * template.compile("sunny")
	 * ```
	 */
	static record<const T extends string | number | symbol>(
		this: void,
		record: { [x in T]: string },
	): Exec<T> {
		return {
			kind: "exec",
			compile(key) {
				return record[key];
			},
		};
	}
	/**
	 * 文字列の配列を受け取り、改行で繋いだ値を使用するプレースホルダを作成する
	 * @example
	 * ```ts
	 * const template = Template.new`# 実行ログ
	 * ${Template.lines()}`;
	 * template.compile(logs.map(log => log.text))
	 * ```
	 */
	static lines(): Exec<string[]> {
		return {
			kind: "exec",
			compile(arg) {
				return arg.join("\n");
			},
		};
	}
}
/**
 * プリミティブなプレースホルダ
 * @template T プレースホルダが受け入れる値
 * @template HasDefault プレースホルダにデフォルト値があるか
 * @property default デフォルト値
 */
export interface Prim<
	T extends StringLike = StringLike,
	HasDefault extends boolean = boolean,
> {
	/**
	 * 種類
	 */
	kind: "primitive";
	/**
	 * デフォルト値
	 * 持っていない場合はnull
	 */
	default: HasDefault extends true ? T : null;
}
// こうしないと壊れます
/**
 * 関数プレースホルダ
 * @template T 関数が受け取る型
 */
export interface Exec<T = unknown> {
	/**
	 * 種類
	 */
	kind: "exec";
	// 実装の敗北
	// 関数を持つプロパティとしての定義では反変ですが、
	// メソッドとして定義すると双変になり型チェックをパスできます。
	/**
	 * 構築時に実行される関数
	 * @param arg 構築時に渡される引数
	 */
	compile(this: void, arg: T): string;
	//compile: (this: void, arg: T) => string;ï
}
/**
 * プレースホルダ
 */
export type Placeholder = Prim | Exec;
/**
 * toStringが実装されているオブジェクト
 */
export type StringLike = { toString: () => string };
/**
 * プレースホルダが要求する型
 */
export type PlaceholderParamaters<
	T extends Placeholder[],
	Rec extends unknown[] = [],
> = T extends [
	infer Head extends Placeholder,
	...infer Tail extends Placeholder[],
]
	? Head extends { kind: "exec" }
		? PlaceholderParamaters<Tail, [...Rec, Parameters<Head["compile"]>[0]]>
		: Head extends Prim<
					infer Type extends StringLike,
					infer HasDefault extends boolean
				>
			? HasDefault extends true
				? PlaceholderParamaters<Tail, [...Rec, (Type | (null | undefined))?]>
				: PlaceholderParamaters<Tail, [...Rec, Type]>
			: never
	: Rec;
/**
 * UnionをIntersectionに変換する
 * @template U Union型
 */
export type UnionToIntersection<U> = (
	U extends U
		? (x: U) => void
		: never
) extends (x: infer I) => void
	? I
	: never;
/**
 * value[],key[]を{ [key]:value }にマップする型
 * @template Values マップされる値
 * @template Keys マップするキー
 */
export type Mapping<
	Values extends unknown[],
	Keys extends Filled<Values, string>,
> = UnionToIntersection<
	{
		[K in keyof Values]: undefined extends Values[K]
			? { [_ in Keys[K]]?: Values[K] }
			: {
					[_ in Keys[K]]: Values[K];
				};
	}[number]
>;
/**
 * TのプロパティをUで埋める型
 * @template T {@link U}で埋められる型
 * @template U {@link T}を埋める型
 */
export type Filled<T, U> = {
	[x in keyof T]: U;
};
type TupleKeys<T extends readonly unknown[]> = Extract<keyof T, `${number}`>;
type IsTuple<T> = T extends readonly unknown[]
	? number extends T["length"]
		? false
		: true
	: false;
type ToNumber<T extends `${number}`> = T extends `${infer N extends number}`
	? N
	: never;
type ArrayKeys<T extends readonly unknown[]> = IsTuple<T> extends true
	? ToNumber<TupleKeys<T>>
	: number;

type PickTuple<
	Tuple extends readonly unknown[],
	T,
	Rec extends readonly unknown[] = [],
> = Tuple extends [infer Head, ...infer Rest]
	? Head extends T
		? PickTuple<Rest, T, [...Rec, Head]>
		: PickTuple<Rest, T, Rec>
	: Rec;

type OmitTuple<
	Tuple extends readonly unknown[],
	T,
	Rec extends readonly unknown[] = [],
> = Tuple extends [infer Head, ...infer Rest]
	? Head extends T
		? OmitTuple<Rest, T, Rec>
		: OmitTuple<Rest, T, [...Rec, Head]>
	: Rec;

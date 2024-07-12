import { describe, expect, it } from "vitest";
import { type Prim, Template } from "./mod.js";
describe("Template", () => {
	it("compile", () => {
		const templateText = Template.new`Hello ${Template.str()}`;
		expect(templateText.compile("World")).toBe("Hello World");
	});
	it("defaultValue", () => {
		const templateText = Template.new`Hello ${Template.str("World")}`;
		expect(templateText.compile()).toBe("Hello World");
		expect(templateText.compile(null)).toBe("Hello World");
		expect(templateText.compile(undefined)).toBe("Hello World");
	});
	it("defaultValue 2", () => {
		const templateText = Template.new`${Template.str("Hello")} ${Template.str()}`;
		expect(templateText.compile(null, "World")).toBe("Hello World");
		expect(templateText.compile("Hi", "World")).toBe("Hi World");
	});
	it("exec", () => {
		const templateText = Template.new`今日の天気は${{
			kind: "exec",
			compile(arg: 0 | 1 | 2) {
				return (["晴れ", "曇り", "雨"] as const)[arg];
			},
		}}です`;
		expect(templateText.compile(0)).toBe("今日の天気は晴れです");
		expect(templateText.compile(1)).toBe("今日の天気は曇りです");
		expect(templateText.compile(2)).toBe("今日の天気は雨です");
	});
	it("static value", () => {
		const env = "my-env";
		const test = Template.new`environment value is ${env}`;
		expect(test.compile()).toBe(`environment value is ${env}`);
	});
	it("tuple", () => {
		const tuple = Template.tuple(["foo", "bar", "baz"]);
		expect(tuple.compile(0)).toBe("foo");
		expect(tuple.compile(1)).toBe("bar");
		expect(tuple.compile(2)).toBe("baz");
		const vec = Template.tuple(
			["hoge", "huga", "piyo"] as string[],
			"fallback",
		);
		expect(vec.compile(0)).toBe("hoge");
		expect(vec.compile(100)).toBe("fallback");
	});
	it("record", () => {
		const weathers = Template.record({
			sunny: "晴れ",
			cloudy: "曇り",
			rainy: "雨",
		});
		const warning = Template.callback((high: number) =>
			high > 30 ? "非常に厳しい温度です。水分補給を忘れずに行ってください" : "",
		);
		const templateText = Template.new`今日は${weathers}で最高気温は${Template.num()}、最低気温は${Template.num()}となるでしょう。${warning}`;

		const compile = templateText.prepare("weather", "high", "low", "high");
		expect(
			compile({
				weather: "sunny",
				high: 31,
				low: 20,
			}),
		).toBe(templateText.compile("sunny", 31, 20, 31));
	});
	it.fails("invalid", () => {
		const templateText = Template.new`Hello ${Template.str()}`;
		// @ts-expect-error should be error
		templateText.compile();
	});
	it("Template.str", () => {
		expect(Template.str()).toEqual<Prim<false>>({
			kind: "primitive",
			default: null,
		});
		expect(Template.str("foo")).toEqual<Prim<string>>({
			kind: "primitive",
			default: "foo",
		});
	});
	it("Template.num", () => {
		expect(Template.num()).toEqual<Prim<number, false>>({
			kind: "primitive",
			default: null,
		});
		expect(Template.num(42)).toEqual<Prim<number, true>>({
			kind: "primitive",
			default: 42,
		});
	});
	it("Template.callback", () => {
		const callback = Template.callback(() => Math.random().toString());
		Template.new`${callback}`.compile("");
	});
	it("Template.cond", () => {
		const cond = Template.cond("foo", "bar");
		expect(cond.compile(true)).toBe("foo");
		expect(cond.compile(false)).toBe("bar");
	});
	it("Template.map", () => {
		const map = Template.record({ foo: "Foo", bar: "Bar" });
		expect(map.compile("foo")).toBe("Foo");
		expect(map.compile("bar")).toBe("Bar");
	});
	it("Template.lines", () => {
		const lines = Template.lines();
		expect(lines.compile(["foo", "bar", "baz"])).toBe("foo\nbar\nbaz");
	});
});

import { Template } from "../mod.ts";
const hello = Template.new`Hello ${Template.str("Template")}!`;

const profile = Template.new`\
Name: ${Template.str()}
Age: ${Template.num()}
Gender: ${Template.tuple(["男性", "女性", "その他", "無回答"])}
Role: ${Template.record({
	admin: "管理者",
	stuff: "スタッフ",
	moderator: "モデレーター",
	member: "メンバー",
})}
Rank: ${Template.cond("プレミアム", "一般")}ユーザー
Log:
${Template.lines()}
`;
const alice = profile.compile("Alice", 18, 1, "admin", true, []);
const compile = profile.prepare(
	"name",
	"age",
	"gender",
	"role",
	"isPremium",
	"logs",
);

const alice2 = compile({
	name: "Alice",
	age: 18,
	gender: 1,
	role: "admin",
	isPremium: true,
	logs: [],
});

console.log(alice2);

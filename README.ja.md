<div align="center">

# 2CY Agent

**ローカルファーストの二次元エージェント · 原稿デスク（BYOK）**

彼女は白黒の原稿デスクに住んでいる：雑談ではキャラらしく、仕事では即戦力。

[![Release](https://img.shields.io/github/v/release/c18229039407-arch/2cy-agent-next?include_prereleases&label=%E3%83%80%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%89&color=bc291b)](../../releases)
[![License](https://img.shields.io/badge/license-MIT-1a1a1f)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-09b2c7)](../../releases)

[简体中文](./README.md) · [English](./README.en.md) · **日本語**

<img src="./assets/hero.svg" alt="2CY Agent 原稿デスク UI" width="820"/>

</div>

---

## 彼女にできること

**キャラのまま、本物の仕事を。** ファイルの読み書き・全文検索・長時間タスク・Web 取得——プロ級のエージェント能力を、あなたのキャラが彼女の口調でこなす。成果物はプロ品質、キャラ味は会話にだけ。

**ネーム（コンテ）が先。** 複雑なタスクではまず「ネーム」モードへ：読み取り専用で実行計画を描き、あなたの確認後に「ペン入れ」へ切り替えて着手。並行作業の「分身」、先行調査の「斥候」も派遣できる。

**ハンコが権限。** ファイル操作・コマンド実行・範囲外アクセスの前に、朱印を掲げて待つ：**承認**（今回のみ）／**全権委任**（この種類は以後 OK）／**却下**。ルールは細かく調整可能、デフォルトは厳格。

**長い会話でも忘れない。** 上限が近づくと自動で「あらすじ」カードに整理；「このコマに戻る」で会話とファイル変更をまとめて巻き戻し；長作業の進捗は「机上メモ」でチェック。

**キャラカードと長期記憶。** 旧版 `.2cy.json` カード互換。好みや習慣をセッションを跨いで記憶——ローカルに平文保存、閲覧・削除・無効化自由。

**すべてローカル。** BYOK（数十のプロバイダ対応）、中間サーバなし、アンインストール＝フォルダ削除。

## インストール

[Releases](../../releases) から対応プラットフォームの zip を：

| プラットフォーム | ファイル | 起動 |
|---|---|---|
| Windows | `2cy-agent-windows-x64-*.zip` | `启动-2CY.bat` をダブルクリック。SmartScreen は「詳細情報 → 実行」（未署名のため） |
| macOS (Apple Silicon) | `2cy-agent-darwin-arm64-*.zip` | 初回は `启动-2CY.command` を右クリック → 開く（未公証のため） |
| Linux | `2cy-agent-linux-x64-*.zip` | `./启动-2CY.sh` |

Node も Bun も不要——単一実行ファイル、ブラウザが自動で開く。

## クイックスタート

1. UI でモデルの API キーを設定（BYOK）；
2. 雑談するか、タスクを渡す：「このフォルダの資料を週報にまとめて」；
3. 複雑な仕事はまずネームモードで計画を確認してから。

## キャラカード

カードを `character.2cy.json` に改名し `~/.local/share/2cy/` へ（Windows は `C:\Users\あなた\.local\share\2cy\`）。新しいセッションから有効。会話で「口癖を××にして」と言えば彼女が自分でカードを更新（要ハンコ）。分身・斥候はキャラを纏わない（設計上の意図）。

## 長期記憶

覚える価値のあることは `~/.local/share/2cy/memory.json` に平文保存。会話で「私の何を覚えてる？」「3 番を忘れて」と管理可能。設定で全体オフも可。

## スキル

`data/skills/<名前>/SKILL.md`（＋スクリプト等）を置けば必要時にロード。読み込みにもハンコが要る。彼女に自分用のスキルを書かせることも。

## 開発

```bash
bun install
bun run dev:web
```

規約は [2CY-FORK.md](./2CY-FORK.md)、貢献は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照。

## ライセンス

MIT — [LICENSE](./LICENSE)（同梱 OSS の著作権表示を含む）。

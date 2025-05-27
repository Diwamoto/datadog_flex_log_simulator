# 🚀 GitHub Pagesでの公開手順

このDatadog Flex Logs料金計算機をGitHub Pagesで公開するための手順です。

## 📋 事前準備

1. **GitHubリポジトリの作成**
   - GitHubで新しいリポジトリを作成
   - このプロジェクトのファイルをリポジトリにプッシュ

## ⚙️ GitHub Pages設定

### 1. リポジトリ設定でPages機能を有効化

1. GitHubリポジトリページで「Settings」タブをクリック
2. 左サイドバーの「Pages」をクリック
3. 「Source」セクションで「GitHub Actions」を選択

### 2. ワークフローの実行

- `main`ブランチにコードをプッシュすると自動的にデプロイが開始されます
- 「Actions」タブでデプロイの進行状況を確認できます

### 3. 手動デプロイ

必要に応じて手動でデプロイを実行できます：

1. リポジトリの「Actions」タブをクリック
2. 「Deploy to GitHub Pages」ワークフローを選択
3. 「Run workflow」ボタンをクリック

## 🌐 公開URL

デプロイが完了すると、以下のURLでアクセスできます：

```
https://[ユーザー名].github.io/[リポジトリ名]/
```

例：`https://username.github.io/datadog-flex-calculator/`

## 📁 ファイル構成

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actionsワークフロー
├── index.html                  # メインページ
├── calculator.js               # 計算ロジック
├── README.md                   # プロジェクト説明
└── DEPLOYMENT.md              # このファイル
```

## 🔧 ワークフローの詳細

### トリガー条件
- `main`ブランチへのプッシュ
- 手動実行（workflow_dispatch）

### 実行内容
1. **Build**: ファイルをGitHub Pagesアーティファクトとしてパッケージ化
2. **Deploy**: GitHub Pagesにデプロイ

### 必要な権限
- `contents: read` - リポジトリの読み取り
- `pages: write` - GitHub Pagesへの書き込み
- `id-token: write` - OIDC認証

## 🚨 トラブルシューティング

### デプロイが失敗する場合

1. **権限の確認**
   - リポジトリ設定でActionsの権限が有効になっているか確認
   - Pages機能が有効になっているか確認

2. **ブランチの確認**
   - `main`ブランチにコードがプッシュされているか確認
   - ワークフローファイルが正しい場所にあるか確認

3. **ファイルの確認**
   - `index.html`がルートディレクトリにあるか確認
   - 必要なファイル（calculator.js等）が含まれているか確認

### カスタムドメインを使用する場合

1. リポジトリ設定の「Pages」セクションでカスタムドメインを設定
2. DNSレコードを適切に設定
3. HTTPS証明書の自動発行を有効化

## 📝 更新手順

1. ローカルでファイルを編集
2. 変更をコミット
3. `main`ブランチにプッシュ
4. 自動的にデプロイが実行される

## 🔗 参考リンク

- [GitHub Pages公式ドキュメント](https://docs.github.com/ja/pages)
- [GitHub Actions公式ドキュメント](https://docs.github.com/ja/actions)
- [GitHub Pages用Actionsマーケットプレイス](https://github.com/marketplace?type=actions&query=pages) 
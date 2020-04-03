## README

以下のコマンドを global に install しておくこと

```
npm install -g serverless
npm install -g wscat
npm install -g parcel
```

`yarn install` で必要なモジュールをインストール

```
yarn install
```

サーバーサイドは以下のコマンドを実行してプロセスを2つ起動する

```
sls dynamodb start
sls offline
```

フロント画面では parcel を使って起動する

```
parcel front/index.html
```

## wscat について

`wscat` コマンドを使うとフロント画面を使わずに検証することができる

複数のターミナルから以下のようにメッセージを送信する。以下の例は test という文字列を送信している。接続中の他のターミナルにも同じテキストが届いている事を確認する

```
wscat -c http://localhost:3001
Connected (press CTRL+C to quit)
> test
< default route received: test
```

なお、disconnect 時にイベントが発生しない場合があり、connectionId が不整合を起こす場合がある。その場合は `sls dynamodb start` を再起動してDBをリセットすること。

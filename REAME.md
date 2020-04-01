## README

`yarn install` で必要なモジュールをインストールして以下のコマンドを実行してプロセスを2つ起動する

```
sls dynamodb start
sls offline
```

次に `wscat` コマンドを使って socket 通信を行う。インストールされていない場合は `npm install -g wscat`

複数のターミナルから以下のようにメッセージを送信する。以下の例は test という文字列を送信している。接続中の他のターミナルにも同じテキストが届いている事を確認する

```
wscat -c http://localhost:3001
Connected (press CTRL+C to quit)
> test
< default route received: test
```

なお、disconnect 時にイベントが発生しない場合があり、connectionId が不整合を起こす場合がある。その場合は `sls dynamodb start` を再起動してDBをリセットすること。

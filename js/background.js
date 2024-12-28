// 背景スクリプトを開始した際に必要な初期化処理
console.log("Background script is running...");

// Google OAuth 認証をトリガーする関数
function startGoogleAuth() {
  const clientId = "YOUR_CLIENT_ID.apps.googleusercontent.com"; // GCPで発行されたOAuthのクライアントID
  const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;
  const scope = "openid email profile";

  // Google OAuth 認証画面のURL
  const authUrl = 
    "https://accounts.google.com/o/oauth2/auth" + 
    "?response_type=token" +
    "&client_id=" + encodeURIComponent(clientId) +
    "&redirect_uri=" + encodeURIComponent(redirectUri) +
    "&scope=" + encodeURIComponent(scope);

  // 認証画面を開き、トークンを取得
  chrome.identity.launchWebAuthFlow(
    { url: authUrl, interactive: true },
    function(redirectUrl) {
      if (chrome.runtime.lastError || !redirectUrl) {
        console.error(chrome.runtime.lastError);
        return;
      }

      // リダイレクトURLからアクセストークンを抽出
      const urlParams = new URL(redirectUrl).hash.substring(1); // #以降の部分を取得
      const params = new URLSearchParams(urlParams);
      const token = params.get("access_token");

      if (token) {
        console.log("Google Access Token:", token);

        // FastAPIサーバーにトークンを送信して検証
        fetch("https://{{ server }}/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ token: token })
        })
          .then(response => response.json())
          .then(data => {
            console.log("サーバーからのレスポンス:", data);

            // 必要があれば、結果をフロント（popup）へ通知
            chrome.runtime.sendMessage({ type: "AUTH_RESULT", data: data });
          })
          .catch(error => console.error("サーバー通信エラー:", error));
      } else {
        console.error("アクセストークン取得失敗");
      }
    }
  );
}

// 拡張機能内でのメッセージをリッスン
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_AUTH") {
    console.log("認証開始メッセージを受信:", message);
    startGoogleAuth();
  }
});
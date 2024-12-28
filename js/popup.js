document.getElementById("authorize").addEventListener("click", () => {
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    console.log("GoogleAuthToken:", token);

    // FastAPIサーバーにトークンを送信して検証
    fetch("https://{{ url }}/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token })
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("サーバーからのレスポンス:", data);
      })
      .catch((error) => {
        console.error("サーバーとの通信エラー:", error);
      });
  });
});
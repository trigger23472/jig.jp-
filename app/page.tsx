// app/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function Shiritori() {
  const [history, setHistory] = useState<string[]>([]); // 初期値は空にしてAPIを待つ
  const [input, setInput] = useState<string>('');
  const [message, setMessage] = useState<string>('ゲームを初期化しています...');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // 初期ロード中

  // 末尾の文字を取得する関数（「ー」対応）
  const getEndChar = (word: string) => {
    let lastChar = word.slice(-1);
    if (lastChar === 'ー' && word.length > 1) {
      lastChar = word.slice(-2, -1);
    }
    return lastChar;
  };

  // 【新規追加】サーバーから最初の単語をランダムに取得する関数
  const fetchInitialWord = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/shiritori');
      const data = await res.json();
      
      setHistory([data.word]);
      setMessage(`AIが「${data.word}」と言いました。「${getEndChar(data.word)}」から始めてね！`);
    } catch (error) {
      setMessage('初期化エラーが発生しました。ページを再読み込みしてください。');
    } finally {
      setIsLoading(false);
    }
  };

  // 画面が開いたときに最初の単語を取りに行く
  useEffect(() => {
    fetchInitialWord();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGameOver || !input || isLoading) return;

    const currentWord = input.trim();
    setIsLoading(true);

    try {
      const response = await fetch('/api/shiritori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentWord, history }),
      });

      const data = await response.json();

      if (data.success) {
        setHistory(data.updatedHistory);
        setMessage(data.message);
        if (data.isGameOver) {
          setIsGameOver(true);
        }
        setInput('');
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage('通信エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // リセット時にも新しく最初のランダム単語を再取得する
  const handleReset = () => {
    setHistory([]);
    setInput('');
    setIsGameOver(false);
    fetchInitialWord();
  };

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-lg text-gray-800">
      <h1 className="text-2xl font-bold text-center mb-6 text-indigo-600">しりとりげーむ</h1>

      {/* 縦幅ブレ防止のスタイル適用済み */}
      <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded text-center font-medium text-indigo-700 text-sm min-h-[3.5rem] flex items-center justify-center">
        {message}
      </div>

      {/* 履歴表示 */}
      <div className="mb-6 border rounded-lg p-4 h-48 overflow-y-auto bg-gray-50 flex flex-wrap gap-2 content-start">
        {history.map((word, index) => (
          <span 
            key={index} 
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              index === history.length - 1 
                ? 'bg-indigo-500 text-white' 
                : index % 2 === 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}
          >
            {word} {index < history.length - 1 && '→'}
          </span>
        ))}
      </div>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isGameOver || isLoading}
          placeholder={isLoading ? "読み込み中..." : "ひらがなで入力"}
          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
        />
        {/* 横幅ブレ防止の固定幅（w-28）適用済み */}
        <button
          type="submit"
          disabled={isGameOver || isLoading}
          className="w-28 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 disabled:bg-gray-400 transition"
        >
          {isLoading ? '送信中...' : '送信'}
        </button>
      </form>

      <div className="text-xs text-gray-400 mb-4 text-center">
        ※実在する名詞のみ使用可能です。
      </div>

      {isGameOver && (
        <button
          onClick={handleReset}
          className="w-full py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600 transition"
        >
          もう一度遊ぶ
        </button>
      )}
    </div>
  );
}
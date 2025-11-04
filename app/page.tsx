'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(6);
  const [guess, setGuess] = useState<string>('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const undoStack = useRef<ImageData[]>([]);

  // 初始化与自适应 DPR
  useEffect(() => {
    const canvas = canvasRef.current!;
    const parent = parentRef.current!;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const resize = () => {
      const w = Math.min(600, parent.clientWidth); // 限宽
      const h = Math.min(600, Math.round(w * 1));  // 正方形
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);

      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height); // 背景白
      ctxRef.current = ctx;
      undoStack.current = [];
      setGuess('');
      setConfidence(null);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
    }
  }, [color, size]);

  const getCanvasPos = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;
    if (e instanceof TouchEvent) {
      const t = (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0];
      clientX = t.clientX;
      clientY = t.clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const beginStroke = (e: MouseEvent | TouchEvent) => {
    const ctx = ctxRef.current!;
    const canvas = canvasRef.current!;
    // 入栈快照（用于撤销）
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStack.current.length > 20) undoStack.current.shift();

    drawingRef.current = true;
    lastPosRef.current = getCanvasPos(e);
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!drawingRef.current) return;
    const ctx = ctxRef.current!;
    const pos = getCanvasPos(e);
    const last = lastPosRef.current || pos;

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.closePath();

    lastPosRef.current = pos;
  };

  const endStroke = () => {
    drawingRef.current = false;
    lastPosRef.current = null;
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const onDown = (e: MouseEvent | TouchEvent) => { e.preventDefault(); beginStroke(e); };
    const onMove = (e: MouseEvent | TouchEvent) => { e.preventDefault(); draw(e); };
    const onUp = (e: MouseEvent | TouchEvent) => { e.preventDefault(); endStroke(); };

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    canvas.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const handleClear = () => {
    const canvas = canvasRef.current!;
    const ctx = ctxRef.current!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setGuess('');
    setConfidence(null);
  };

  const handleUndo = () => {
    const ctx = ctxRef.current!;
    const canvas = canvasRef.current!;
    const prev = undoStack.current.pop();
    if (prev) {
      ctx.putImageData(prev, 0, 0);
    }
  };

  const handleGuess = async () => {
    setLoading(true);
    setGuess('');
    setConfidence(null);

    try {
      const canvas = canvasRef.current!;
      // 将画布导出为 PNG base64（去掉 dataURL 前缀，只上传数据体）
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      const base64 = dataUrl.split(',')[1];

      const res = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setGuess('服务错误');
        console.error(msg);
        return;
      }

      const data = await res.json();
      setGuess(data?.guess ?? '不确定');
      setConfidence(
        typeof data?.confidence === 'number' ? data.confidence : null
      );
    } catch (err) {
      console.error(err);
      setGuess('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 920, margin: '0 auto', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>AI 你画我猜</h1>
      <div ref={parentRef} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', background: '#fff', borderRadius: 6, touchAction: 'none', cursor: 'crosshair' }}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label>颜色 <input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
          <label>粗细 <input type="range" min={2} max={30} value={size} onChange={(e) => setSize(Number(e.target.value))} /></label>
          <button onClick={handleUndo} style={btnStyle}>撤销</button>
          <button onClick={handleClear} style={btnStyle}>清空</button>
          <button onClick={handleGuess} style={{ ...btnStyle, background: '#111', color: '#fff' }} disabled={loading}>
            {loading ? 'AI 正在猜…' : '让 AI 猜'}
          </button>
        </div>
        <div style={{ marginTop: 10, minHeight: 28 }}>
          {guess && (
            <span>AI 猜测：<b>{guess}</b>{confidence != null ? `（置信度 ${confidence.toFixed(2)}）` : ''}</span>
          )}
        </div>
      </div>
      <p style={{ color: '#666', marginTop: 12, fontSize: 13 }}>
        小提示：尽量画得简洁清晰，使用较粗的线条。结果仅供娱乐。
      </p>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #ccc',
  background: '#f8f8f8',
  borderRadius: 6,
  cursor: 'pointer',
};

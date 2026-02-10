import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Memo() {
  const navigate = useNavigate()
  const [memos, setMemos] = useState(() => {
    const saved = localStorage.getItem('memos')
    return saved ? JSON.parse(saved) : []
  })
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    localStorage.setItem('memos', JSON.stringify(memos))
  }, [memos])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    if (editingId) {
      setMemos(memos.map(memo =>
        memo.id === editingId
          ? { ...memo, title, content, updatedAt: new Date().toISOString() }
          : memo
      ))
      setEditingId(null)
    } else {
      setMemos([
        {
          id: Date.now(),
          title,
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...memos,
      ])
    }
    setTitle('')
    setContent('')
  }

  const handleEdit = (memo) => {
    setEditingId(memo.id)
    setTitle(memo.title)
    setContent(memo.content)
  }

  const handleDelete = (id) => {
    setMemos(memos.filter(memo => memo.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setTitle('')
      setContent('')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← 홈
        </button>
        <h1>Memo</h1>
      </div>

      <div className="memo-layout">
        <form className="memo-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="내용을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          <div className="form-actions">
            <button type="submit">
              {editingId ? '수정' : '추가'}
            </button>
            {editingId && (
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                취소
              </button>
            )}
          </div>
        </form>

        {memos.length === 0 ? (
          <p className="empty-message">메모가 없습니다. 새 메모를 작성해보세요.</p>
        ) : (
          <div className="memo-list">
            {memos.map(memo => (
              <div key={memo.id} className="memo-card">
                <div className="memo-header">
                  <h3>{memo.title}</h3>
                  <div className="memo-actions">
                    <button onClick={() => handleEdit(memo)}>수정</button>
                    <button className="btn-delete" onClick={() => handleDelete(memo.id)}>삭제</button>
                  </div>
                </div>
                {memo.content && <p className="memo-content">{memo.content}</p>}
                <span className="memo-date">{formatDate(memo.updatedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Memo

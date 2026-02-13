import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../theme/ThemeContext.jsx";
import "./MealCalculator.css";

function addCommas(v) {
  const [int, dec] = v.split(".");
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec !== undefined ? `${withCommas}.${dec}` : withCommas;
}

function stripCommas(v) {
  return v.replace(/,/g, "");
}

function formatNumber(n) {
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

function getWeekdays() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function formatDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()} (${DAY_NAMES[d.getDay()]})`;
}

const STORAGE_KEY = "meal-nicknames";

function loadNicknames() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveNicknames(names) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
}

function reorder(arr, from, to) {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function MealCalculator() {
  const navigate = useNavigate();
  const [nicknames, setNicknames] = useState(() => loadNicknames());
  const [showPopup, setShowPopup] = useState(false);
  const [newName, setNewName] = useState("");
  const [popupError, setPopupError] = useState("");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const weekdays = useMemo(() => getWeekdays(), []);

  const [amounts, setAmounts] = useState(() =>
    Array.from({ length: 5 }, () => Array(nicknames.length).fill(""))
  );
  const [tips, setTips] = useState(() => Array(5).fill(""));

  // Touch drag refs
  const touchStartX = useRef(null);
  const touchDragIdx = useRef(null);
  const thRefs = useRef([]);

  useEffect(() => {
    if (nicknames.length === 0) setShowPopup(true);
  }, []);

  useEffect(() => {
    setAmounts((prev) =>
      prev.map((row) => {
        if (row.length < nicknames.length) {
          return [...row, ...Array(nicknames.length - row.length).fill("")];
        }
        return row.slice(0, nicknames.length);
      })
    );
  }, [nicknames.length]);

  useEffect(() => {
    saveNicknames(nicknames);
  }, [nicknames]);

  const handleAddNickname = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setPopupError("닉네임을 입력해주세요");
      return;
    }
    if (trimmed.length > 20) {
      setPopupError("닉네임은 최대 20자까지 가능합니다");
      return;
    }
    if (nicknames.includes(trimmed)) {
      setPopupError("이미 존재하는 닉네임입니다");
      return;
    }
    setNicknames((prev) => [...prev, trimmed]);
    setNewName("");
    setPopupError("");
    setShowPopup(false);
  };

  const handleCancelPopup = () => {
    if (nicknames.length === 0) {
      navigate("/");
    } else {
      setShowPopup(false);
      setNewName("");
      setPopupError("");
    }
  };

  const handleDeleteNickname = (idx) => {
    setNicknames((prev) => prev.filter((_, i) => i !== idx));
    setAmounts((prev) => prev.map((row) => row.filter((_, i) => i !== idx)));
    setDeleteTarget(null);
  };

  const handleReorder = (from, to) => {
    if (from === to) return;
    setNicknames((prev) => reorder(prev, from, to));
    setAmounts((prev) => prev.map((row) => reorder(row, from, to)));
  };

  const handleAmountChange = (dayIdx, personIdx) => (e) => {
    const input = e.currentTarget;
    const cursor = input.selectionStart ?? input.value.length;
    const digitsBeforeCursor = stripCommas(
      input.value.slice(0, cursor)
    ).replace(/[^0-9]/g, "").length;
    const raw = stripCommas(input.value).replace(/[^0-9]/g, "");

    setAmounts((prev) => {
      const next = prev.map((r) => [...r]);
      next[dayIdx][personIdx] = raw;
      return next;
    });

    requestAnimationFrame(() => {
      if (document.activeElement !== input) return;
      const formatted = raw ? addCommas(raw) : "";
      let nextCursor = 0;
      let digitCount = 0;
      while (nextCursor < formatted.length && digitCount < digitsBeforeCursor) {
        if (/[0-9]/.test(formatted[nextCursor])) digitCount++;
        nextCursor++;
      }
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleTipChange = (dayIdx) => (e) => {
    const input = e.currentTarget;
    const cursor = input.selectionStart ?? input.value.length;
    const digitsBeforeCursor = stripCommas(
      input.value.slice(0, cursor)
    ).replace(/[^0-9]/g, "").length;
    const raw = stripCommas(input.value).replace(/[^0-9]/g, "");

    setTips((prev) => {
      const next = [...prev];
      next[dayIdx] = raw;
      return next;
    });

    requestAnimationFrame(() => {
      if (document.activeElement !== input) return;
      const formatted = raw ? addCommas(raw) : "";
      let nextCursor = 0;
      let digitCount = 0;
      while (nextCursor < formatted.length && digitCount < digitsBeforeCursor) {
        if (/[0-9]/.test(formatted[nextCursor])) digitCount++;
        nextCursor++;
      }
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const breakdowns = useMemo(() => {
    const rows = Array.from({ length: nicknames.length }, () => ({
      meal: 0,
      tip: 0,
      subtotal: 0,
      discarded: 0,
      total: 0,
    }));

    for (let d = 0; d < 5; d++) {
      const tip = Number(tips[d]) || 0;
      const dayAmounts = amounts[d] || [];

      const eaters = [];
      for (let p = 0; p < nicknames.length; p++) {
        if ((Number(dayAmounts[p]) || 0) > 0) eaters.push(p);
      }

      const tipShare = eaters.length > 0 ? tip / eaters.length : 0;

      for (const p of eaters) {
        const meal = Number(dayAmounts[p]) || 0;
        rows[p].meal += meal;
        rows[p].tip += tipShare;
      }
    }

    for (let p = 0; p < rows.length; p++) {
      rows[p].subtotal = rows[p].meal + rows[p].tip;
      rows[p].total = Math.floor(rows[p].subtotal / 100) * 100;
      rows[p].discarded = rows[p].subtotal - rows[p].total;
    }

    return rows;
  }, [amounts, tips, nicknames.length]);

  const settlementMembers = useMemo(
    () =>
      nicknames
        .map((name, idx) => ({ name, total: breakdowns[idx]?.total || 0 }))
        .filter((item) => item.total > 0),
    [nicknames, breakdowns]
  );

  const breakdownTotals = useMemo(() => {
    return breakdowns.reduce(
      (acc, row) => {
        acc.meal += row.meal;
        acc.tip += row.tip;
        acc.discarded += row.discarded;
        acc.total += row.total;
        return acc;
      },
      { meal: 0, tip: 0, discarded: 0, total: 0 }
    );
  }, [breakdowns]);

  const hasSettlementMembers = settlementMembers.length > 0;

  const copyPreviewText = useMemo(() => {
    const lines = ["🍽️ 이번 주 식비"];
    for (const item of settlementMembers) {
      lines.push(`${item.name}: ${formatNumber(item.total)}원`);
    }
    return lines.join("\n");
  }, [settlementMembers]);

  const handleCopy = () => {
    if (!hasSettlementMembers) return;
    navigator.clipboard.writeText(copyPreviewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Drag handlers
  const onDragStart = (idx) => (e) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (idx) => (e) => {
    e.preventDefault();
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };

  const onDragEnd = () => {
    if (dragIdx !== null && dragOverIdx !== null) {
      handleReorder(dragIdx, dragOverIdx);
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };

  // Touch drag handlers
  const onTouchStart = (idx) => (e) => {
    setDragIdx(idx);
    touchStartX.current = e.touches[0].clientX;
    touchDragIdx.current = idx;
  };

  const onTouchMove = (e) => {
    if (touchDragIdx.current === null) return;
    const x = e.touches[0].clientX;
    for (let i = 0; i < thRefs.current.length; i++) {
      const el = thRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right) {
        if (dragOverIdx !== i) setDragOverIdx(i);
        break;
      }
    }
  };

  const onTouchEnd = () => {
    if (touchDragIdx.current !== null && dragOverIdx !== null) {
      handleReorder(touchDragIdx.current, dragOverIdx);
    }
    setDragIdx(null);
    touchDragIdx.current = null;
    touchStartX.current = null;
    setDragOverIdx(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate("/")}>
          ← 홈
        </button>
        <h1>식비 계산기</h1>
        {nicknames.length > 0 && (
          <div className="mc-header-actions">
            <button
              className={`mc-edit-btn${editing ? " active" : ""}`}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "완료" : "편집"}
            </button>
            <button
              className="mc-edit-btn mc-add-person-btn"
              onClick={() => setShowPopup(true)}
            >
              추가
            </button>
          </div>
        )}
        <ThemeToggle />
      </div>

      {nicknames.length > 0 && (
        <>
          <div className="mc-section">
            {editing && (
              <div className="mc-scroll-guide" role="note">
                <span className="mc-scroll-guide-icon">↔</span>
                <span>
                  닉네임 위 핸들을 드래그해서 열 순서를 바꿀 수 있어요.
                </span>
              </div>
            )}
            <div className="mc-table-wrap">
              <table className="mc-table">
                <thead>
                  <tr>
                    <th className="mc-th-date">날짜</th>
                    <th className="mc-th-tip">배달팁</th>
                    {nicknames.map((name, i) => (
                      <th
                        key={name}
                        ref={(el) => (thRefs.current[i] = el)}
                        className={`mc-th-name${
                          editing ? " mc-th-editable" : ""
                        }${
                          dragOverIdx === i && dragIdx !== null
                            ? " mc-th-drag-over"
                            : ""
                        }`}
                        onDragOver={editing ? onDragOver(i) : undefined}
                      >
                        {editing && (
                          <div className="mc-drag-handle-row">
                            <button
                              className="mc-drag-handle"
                              draggable
                              onDragStart={onDragStart(i)}
                              onDragEnd={onDragEnd}
                              onTouchStart={onTouchStart(i)}
                              onTouchMove={onTouchMove}
                              onTouchEnd={onTouchEnd}
                              aria-label={`${name} 열 이동 핸들`}
                            >
                              <span
                                className="mc-drag-handle-bars"
                                aria-hidden="true"
                              >
                                <span />
                                <span />
                                <span />
                              </span>
                            </button>
                          </div>
                        )}
                        <div className="mc-th-name-row">
                          <span className="mc-th-name-label">{name}</span>
                          {editing && (
                            <button
                              className="mc-icon-btn mc-remove-btn"
                              onClick={() => setDeleteTarget(i)}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weekdays.map((day, d) => (
                    <tr key={d}>
                      <td className="mc-date">{formatDate(day)}</td>
                      <td>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="mc-input"
                          placeholder="0"
                          value={tips[d] ? addCommas(tips[d]) : ""}
                          onChange={handleTipChange(d)}
                        />
                      </td>
                      {nicknames.map((_, p) => (
                        <td key={nicknames[p]} className="mc-col-cell">
                          <input
                            type="text"
                            inputMode="numeric"
                            className="mc-input"
                            placeholder="0"
                            value={
                              amounts[d]?.[p] ? addCommas(amounts[d][p]) : ""
                            }
                            onChange={handleAmountChange(d, p)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="mc-total-row">
                    <td className="mc-total-label">합계</td>
                    <td className="mc-total-sub-value">
                      {formatNumber(Math.round(breakdownTotals.meal))}원
                    </td>
                    {nicknames.map((_, p) => (
                      <td
                        key={`meal-${nicknames[p]}`}
                        className="mc-total-sub-value mc-col-cell"
                      >
                        {formatNumber(Math.round(breakdowns[p]?.meal || 0))}원
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="mc-total-label">배달팁</td>
                    <td className="mc-total-sub-value">
                      {formatNumber(Math.round(breakdownTotals.tip))}원
                    </td>
                    {nicknames.map((_, p) => (
                      <td
                        key={`tip-${nicknames[p]}`}
                        className="mc-total-sub-value mc-col-cell"
                      >
                        {formatNumber(Math.round(breakdowns[p]?.tip || 0))}원
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="mc-total-label">미만 버림</td>
                    <td className="mc-total-sub-value">
                      -{formatNumber(Math.round(breakdownTotals.discarded))}원
                    </td>
                    {nicknames.map((_, p) => (
                      <td
                        key={`discard-${nicknames[p]}`}
                        className="mc-total-sub-value mc-col-cell"
                      >
                        -
                        {formatNumber(
                          Math.round(breakdowns[p]?.discarded || 0)
                        )}
                        원
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="mc-total-label">총 계</td>
                    <td className="mc-total-value">
                      {formatNumber(breakdownTotals.total)}원
                    </td>
                    {nicknames.map((_, p) => (
                      <td
                        key={`total-${nicknames[p]}`}
                        className="mc-total-value mc-col-cell"
                      >
                        {formatNumber(breakdowns[p]?.total || 0)}원
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mc-section mc-summary">
            <div
              className={`mc-summary-header${
                hasSettlementMembers ? " has-preview" : ""
              }`}
            >
              <h2 className="mc-summary-title">정산 내역</h2>
              {hasSettlementMembers && (
                <div className="mc-preview-header">
                  <h2 className="mc-summary-title mc-preview-title">
                    복사 미리보기
                  </h2>
                  <button className="mc-copy-btn" onClick={handleCopy}>
                    {copied ? "복사됨!" : "복사"}
                  </button>
                </div>
              )}
            </div>
            <div
              className={`mc-summary-content${
                hasSettlementMembers ? " with-preview" : " no-preview"
              }`}
            >
              <div className="mc-summary-list">
                {nicknames.map((name, i) => (
                  <div key={i} className="mc-summary-item">
                    <span className="mc-summary-name">{name}</span>
                    <span className="mc-summary-amount">
                      {formatNumber(breakdowns[i]?.total || 0)}원
                    </span>
                  </div>
                ))}
              </div>
              {hasSettlementMembers && (
                <aside className="mc-preview">
                  <pre className="mc-preview-text">{copyPreviewText}</pre>
                </aside>
              )}
            </div>
          </div>
        </>
      )}

      {deleteTarget !== null && (
        <div className="mc-popup-overlay">
          <div className="mc-popup">
            <h2 className="mc-popup-title">정말 제거할까요?</h2>
            <p className="mc-popup-desc">
              '{nicknames[deleteTarget]}'을(를) 목록에서 제거합니다.
            </p>
            <div className="mc-popup-actions">
              <button
                className="mc-popup-cancel"
                onClick={() => setDeleteTarget(null)}
              >
                취소
              </button>
              <button
                className="mc-popup-delete"
                onClick={() => handleDeleteNickname(deleteTarget)}
              >
                제거
              </button>
            </div>
          </div>
        </div>
      )}

      {showPopup && (
        <div className="mc-popup-overlay">
          <div className="mc-popup">
            <h2 className="mc-popup-title">인원 추가</h2>
            <input
              type="text"
              className="mc-popup-input"
              placeholder="닉네임 입력 (최대 20자)"
              maxLength={20}
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setPopupError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddNickname();
              }}
              autoFocus
            />
            {popupError && <div className="mc-popup-error">{popupError}</div>}
            <div className="mc-popup-actions">
              <button className="mc-popup-cancel" onClick={handleCancelPopup}>
                취소
              </button>
              <button className="mc-popup-add" onClick={handleAddNickname}>
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MealCalculator;

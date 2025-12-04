import "./PermissionModal.css";

export default function PermissionModal({ visible, onClose }) {
  if (!visible) return null;

  return (
    <div className="perm-overlay" onClick={onClose}>
      <div className="perm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="perm-icon">
          📸
        </div>
        <h2>카메라 권한이 필요해요</h2>
        <p className="perm-desc">
          브라우저 상단의 <strong>“허용”</strong> 버튼을 눌러주세요!
        </p>

        <button className="perm-btn" onClick={onClose}>
          확인했어요
        </button>
      </div>
    </div>
  );
}

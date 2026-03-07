const JoinCallModal = ({ isOpen, onClose, onJoin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg w-80 shadow-lg">
        <h3 className="text-lg font-bold mb-3">Incoming Video Call</h3>
        <p className="text-sm opacity-80 mb-4">
          📞 You have a video call. Do you want to join now?
        </p>

        <div className="flex justify-end gap-2">
          <button
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            onClick={onClose}
          >
            Decline
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={onJoin}
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinCallModal;

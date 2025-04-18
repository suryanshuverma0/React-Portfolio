
const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-neutral-950">
      <div className="w-64 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div className="w-1/2 h-full bg-red-500 animate-[progress_2s_ease-in-out]"></div>
      </div>
    </div>
  );
};

export default Loading;
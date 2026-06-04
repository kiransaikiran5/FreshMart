export default function StarRating({ rating = 0, onRate, interactive = false, size = 'text-xl' }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${size} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} ${
            interactive ? 'cursor-pointer hover:text-yellow-400' : ''
          }`}
          onClick={() => interactive && onRate?.(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
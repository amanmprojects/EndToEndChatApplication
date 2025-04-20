interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const Spinner = ({ size = 'medium', color = '#4f46e5' }: SpinnerProps) => {
  const sizeMap = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeMap[size]} animate-spin rounded-full border-2 border-t-transparent`}
        style={{ borderColor: `${color} transparent transparent transparent` }}
      ></div>
    </div>
  );
};

export default Spinner;
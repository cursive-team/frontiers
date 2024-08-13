export const NoResultContent = ({ children }: any) => {
  return (
    <div className="flex justify-center items-center mt-[64px] mx-[64px]">
      <span className="text-white/50 font-semibold font-inter text-center">
        {children || "No result"}
      </span>
    </div>
  );
};

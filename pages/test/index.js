import Background from "@/components/skytest";
import Time from "@/components/time";

export default function Home() {
  return (
<>
        <div className="relative font-sans bg-white">
            <div className="flex justify-center items-center min-h-screen">
                <Time />
            </div>
            <Background />
        </div>
    </>
  );
}

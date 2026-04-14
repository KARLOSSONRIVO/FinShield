import Image from "next/image"

export default function Loading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <Image
                    src="/assets/image/FinShield.svg"
                    alt="Loading..."
                    width={120}
                    height={120}
                    className="animate-pulse"
                />
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
        </div>
    )
}

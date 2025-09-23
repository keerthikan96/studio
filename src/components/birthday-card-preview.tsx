
'use client';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Image from 'next/image';

type BirthdayCardPreviewProps = {
    name: string;
    imageUrl: string;
    type: 'birthday' | 'anniversary';
    years?: number;
};

// A simple component to render the logos shown in the design.
const Logo = ({ text, subtext, className }: { text: string, subtext?: string, className?: string }) => (
    <div className={className}>
        <p className="text-blue-400 font-bold text-lg">{text}</p>
        {subtext && <p className="text-blue-300 text-xs">{subtext}</p>}
    </div>
)

export default function BirthdayCardPreview({ name, imageUrl, type, years }: BirthdayCardPreviewProps) {
    const title = type === 'birthday' ? 'Happy Birthday' : `Happy ${years}th Anniversary`;

    return (
        <div className="relative w-full aspect-[1] bg-black text-white font-serif overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-yellow-400/90 clip-path-polygon-bl"></div>
            <div className="absolute top-0 right-0 w-1/3 h-1/4 bg-yellow-400/90 opacity-50 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-1/4 h-1/3 bg-yellow-400/90 opacity-30 blur-3xl"></div>
            
            {/* Decorative Ribbons */}
            <Image src="https://storage.googleapis.com/gemini-studio-assets-dev/ribbon-1.svg" alt="ribbon" width={100} height={100} className="absolute bottom-0 left-0 w-24 h-auto" />
            <Image src="https://storage.googleapis.com/gemini-studio-assets-dev/ribbon-1.svg" alt="ribbon" width={100} height={100} className="absolute bottom-10 right-0 w-16 h-auto transform scale-x-[-1]" />
            

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-between h-full p-6">
                <header className="w-full flex justify-between items-start">
                    <Logo text="MuniLogic" subtext="Simply Empowering" />
                    <Logo text="INVORG" subtext="INNOVATION. DELIVERED." className="text-right" />
                </header>

                <div className="flex-grow flex flex-col items-center justify-center -mt-8">
                     <h1 className="text-5xl italic font-thin tracking-wider mb-4" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                        {title}
                    </h1>
                   
                    <div className="relative p-1.5 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full shadow-lg">
                         <Avatar className="w-40 h-40 border-4 border-black">
                            <AvatarImage src={imageUrl} alt={name} />
                            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="relative mt-[-28px] z-10 px-8 py-2 bg-gradient-to-r from-yellow-500 to-yellow-400 shadow-md">
                        <p className="text-2xl font-bold text-black tracking-widest">{name.toUpperCase()}</p>
                    </div>
                </div>

                <footer className="text-center pb-4">
                    <p className="text-sm text-yellow-100/90">
                        Wishing you the best on your special day and everything good in the year ahead.
                    </p>
                    <p className="text-sm font-bold mt-2 text-yellow-200">From INVORG Family</p>
                </footer>
            </div>
            {/* CSS for the clip-path */}
            <style jsx>{`
                .clip-path-polygon-bl {
                    clip-path: polygon(0 0, 100% 0, 100% 40%, 0 100%);
                }
            `}</style>
        </div>
    );
}


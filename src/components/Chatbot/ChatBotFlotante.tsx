import { useState } from "react";
import agrosoft from '../../assets/img/agrosoft.png'
import { ChatbotIA } from "./ChatBotIA";



export default function ChatBotFlotante(){
    const [abierto, setAbierto] = useState(false);

    return(
        <>
        <button
            onClick={()=> setAbierto(!abierto)}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50  text-white rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg transition-all border-2 border-black">
                {abierto ? <img src={agrosoft} alt="chat" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" /> : <img src={agrosoft} alt="chat" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" /> }
            </button>

            {abierto && (
                <div className="fixed inset-x-4 bottom-20 sm:inset-x-auto sm:bottom-24 sm:right-6 z-50 w-auto sm:w-96 h-[75vh] sm:h-[500px] max-h-[600px] rounded-2xl shadow-2xl border-2 border-black flex flex-col overflow-hidden bg-white">
                    <ChatbotIA/>
                </div>
            )}
        
        </>
    )
}
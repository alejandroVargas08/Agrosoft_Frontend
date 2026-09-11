import { ChatbotIA } from '../componets/Chatbot/ChatBotIA';


function AsistenteIA() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-extrabold text-neutral-900">
        IA AgroSoft
      </h1>
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <ChatbotIA />
      </div>
    </div>
    
  );
}

export default AsistenteIA;
// Mock implementation for WhatsApp Provider (e.g., using Meta Cloud API or Twilio)
// In production, this would use axios to hit the Meta Graph API

export const sendWhatsAppMessage = async (toPhone, templateName, components = []) => {
    console.log(`\n===========================================`);
    console.log(`📱 WHATSAPP MESSAGE (API MOCK)`);
    console.log(`To: ${toPhone}`);
    console.log(`Template: ${templateName}`);
    console.log(`Payload:`, JSON.stringify(components, null, 2));
    console.log(`Status: Message queued for delivery via WhatsApp Business API`);
    console.log(`===========================================\n`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
        success: true,
        messageId: `wamid.HBgL${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };
};

export const sendWhatsAppBroadcast = async (phones, messageBody) => {
    console.log(`\n💬 WHATSAPP BROADCAST (API MOCK)`);
    console.log(`Audience Size: ${phones.length}`);
    console.log(`Message Preview: "${messageBody.substring(0, 50)}..."`);
    
    // Output success dynamically
    return {
        success: true,
        delivered: phones.length,
        failed: 0,
        batchId: `batch_wa_${Date.now()}`
    };
};

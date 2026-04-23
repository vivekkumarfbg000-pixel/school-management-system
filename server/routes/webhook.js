import express from 'express';
import supabase from '../utils/supabaseClient.js';
import { sendWhatsAppMessage } from '../utils/whatsappProvider.js';

const router = express.Router();

// Meta Webhook Verification
router.get('/whatsapp', (req, res) => {
  const verify_token = process.env.WHATSAPP_VERIFY_TOKEN || 'edustream_secure_webhook_token';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verify_token) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Meta Webhook Payload Processing
router.post('/whatsapp', async (req, res) => {
  const body = req.body;

  if (body.object) {
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0] && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
      
      const messageData = body.entry[0].changes[0].value.messages[0];
      const fromPhone = messageData.from; // Sender's phone number (e.g. 919876543210)
      const msgBody = messageData.text?.body?.trim();
      
      if (msgBody) {
        console.log(`[WhatsApp Webhook] Received message from ${fromPhone}: "${msgBody}"`);
        
        // Expense Parsing: Matches "Exp 500 tea" or "exp 1500 bus diesel"
        const expenseMatch = msgBody.match(/^exp\s+(\d+(?:\.\d+)?)\s+(.+)$/i);
        
        if (expenseMatch) {
          const amount = parseFloat(expenseMatch[1]);
          const description = expenseMatch[2];
          
          try {
            // Validate sender is an authorized Principal
            const phoneWithoutCountry = fromPhone.startsWith('91') ? fromPhone.slice(2) : fromPhone;
            const { data: user } = await supabase
              .from('users')
              .select('id, name, school_id, role')
              .or(`phone.eq.${fromPhone},phone.eq.${phoneWithoutCountry}`)
              .eq('role', 'PRINCIPAL')
              .single();
              
            if (user) {
              // Log the expense
              const { error: expError } = await supabase.from('expenses').insert({
                school_id: user.school_id,
                amount: amount,
                category: 'Operations', // Default category
                description: description,
                date: new Date().toISOString().split('T')[0],
                recorded_by: user.id
              });
              
              if (!expError) {
                // Send confirmation receipt back
                await sendWhatsAppMessage(fromPhone, `✅ *Expense Logged*\n₹${amount} for "${description}" has been added to today's ledger.`);
              } else {
                console.error("[WhatsApp Webhook] Error logging expense:", expError);
              }
            } else {
               // Ignore if not a Principal or not found for Expense log
               console.log(`[WhatsApp Webhook] Sender ${fromPhone} is not an authorized principal for expense logging.`);
            }
          } catch (err) {
            console.error("[WhatsApp Webhook] DB error processing expense:", err);
          }
        } else {
          // It's not an expense. Check if it's a PARENT command
          const command = msgBody.toUpperCase();
          
          if (command === 'DETAILS' || command === 'PAID') {
             try {
                const phoneWithoutCountry = fromPhone.startsWith('91') ? fromPhone.slice(2) : fromPhone;
                
                // Find student by parent phone
                const { data: student } = await supabase
                  .from('students')
                  .select('id, name, class_name, section')
                  .or(`phone.eq.${fromPhone},phone.eq.${phoneWithoutCountry}`)
                  .limit(1)
                  .single();
                  
                if (student) {
                    if (command === 'DETAILS') {
                        // Fetch pending fees
                        const { data: fees } = await supabase
                          .from('fees')
                          .select('amount, paid_amount, due_date')
                          .eq('student_id', student.id)
                          .in('status', ['Pending', 'Partial', 'Overdue']);
                          
                        const totalPending = fees?.reduce((sum, f) => sum + (f.amount - (f.paid_amount || 0)), 0) || 0;
                        
                        let reply = `📄 *Fee Details for ${student.name}*\n`;
                        if (totalPending > 0) {
                            reply += `Total Pending: *₹${totalPending}*\n\nPlease type *PAID* if you have transferred the amount via UPI.`;
                        } else {
                            reply += `✅ All fees are cleared! Thank you.`;
                        }
                        
                        await sendWhatsAppMessage(fromPhone, reply);
                        
                    } else if (command === 'PAID') {
                        // Mark interaction as waiting for screenshot/UPI ID (stateless simple reply for now)
                        await sendWhatsAppMessage(fromPhone, `Thank you for paying for ${student.name}! 🙏\n\nPlease reply to this message with your *UPI Transaction ID* or a *Screenshot* of the payment so our accounts team can verify it.`);
                        // In a real flow, the NEXT message with an image/ID would be logged as "Verification Pending".
                    }
                } else {
                   // Ignore if not found
                   console.log(`[WhatsApp Webhook] Unrecognized phone number for command: ${fromPhone}`);
                }
             } catch (err) {
                 console.error("[WhatsApp Webhook] DB error processing parent command:", err);
             }
          }
          
          // Teacher Bot Command: "Attendance 5A"
          const attMatch = msgBody.match(/^attendance\s+([a-zA-Z0-9]+)$/i) || msgBody.match(/^att\s+([a-zA-Z0-9]+)$/i);
          if (attMatch) {
             const className = attMatch[1].toUpperCase();
             try {
                const phoneWithoutCountry = fromPhone.startsWith('91') ? fromPhone.slice(2) : fromPhone;
                // Verify sender is a Teacher or Principal
                const { data: user } = await supabase
                  .from('users')
                  .select('id, name, role')
                  .or(`phone.eq.${fromPhone},phone.eq.${phoneWithoutCountry}`)
                  .in('role', ['TEACHER', 'PRINCIPAL', 'ADMIN'])
                  .single();
                  
                if (user) {
                    // Generate Magic Link
                    // In production, this would be a signed JWT link to auto-login.
                    // For now, redirect to the PWA attendance module with pre-filled filters.
                    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
                    const magicLink = `${baseUrl}/attendance?class=${className}`;
                    
                    await sendWhatsAppMessage(fromPhone, `🏫 *Attendance for Class ${className}*\n\nTap the link below to securely mark today's attendance. Parents will be notified instantly when you save.\n\n🔗 ${magicLink}`);
                } else {
                    console.log(`[WhatsApp Webhook] Unauthorized attendance request from ${fromPhone}`);
                }
             } catch (err) {
                 console.error("[WhatsApp Webhook] DB error processing teacher command:", err);
             }
          }
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

export default router;

import twilio from 'twilio';

/**
 * SMS service.
 * - SMS_PROVIDER=twilio — отправка через Twilio (нужны TWILIO_* в .env)
 * - иначе — код выводится в консоль (для разработки)
 */
export async function sendSmsCode(phone, code) {
  const provider = process.env.SMS_PROVIDER;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (provider === 'twilio' && sid && token && fromNumber) {
    try {
      const client = twilio(sid, token);
      await client.messages.create({
        body: `Ваш код подтверждения: ${code}`,
        from: fromNumber,
        to: phone
      });
      return true;
    } catch (err) {
      console.error('[SMS] Twilio error:', err.message);
      throw new Error('Не удалось отправить SMS');
    }
  }

  // Режим разработки: вывод кода в консоль
  console.log(`[SMS] Код для ${phone}: ${code}`);
  return true;
}

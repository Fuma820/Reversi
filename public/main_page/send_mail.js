const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });  // CORSを追加

admin.initializeApp();

const transporter = nodemailer.createTransport({
    service: 'gmail', // Gmailを使用する場合
    auth: {
        user: 'fuuma820@mail.com', // 自分のメールアドレス
        pass: '820Fu330171320' // メールアドレスのパスワード
    }
});

exports.sendMail = functions.https.onCall((data, context) => {
    return cors((req, res) => {
        const mailOptions = {
            from: 'fuuma820@gmail.com',
            to: 'fuuma820@example.com', // 送信先のメールアドレス
            subject: 'お問い合わせフォームからのメッセージ',
            text: `名前: ${data.name}\nメールアドレス: ${data.email}\n\nメッセージ:\n${data.message}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                res.status(500).send(error.toString());
            } else {
                res.status(200).send('Success');
            }
        });
    })(data, context);
});

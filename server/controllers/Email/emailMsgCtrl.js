const expressAsyncHandler = require("express-async-handler");
const EmailMessage = require("../../model/emailMsg/EmailMessaging");
const mailSender = require("../../utils/MailSender");
const Filter = require('bad-words');

const sendEmailMsgCtrl = expressAsyncHandler(async(req,res)=>{
    const { to, subject, message} = req.body;

    const emailMsg = subject+ " "+message;
    const filter = new Filter();

    const isProfane = filter.isProfane(emailMsg);

    if(isProfane) throw new Error ("it contains bad words so fuck yourself")
    try{
        mailSender(to, subject, message);

       const sentEmail = await EmailMessage.create({
        from:req.user.email,
        sentBy:req.user._id,
        to,
        subject,
        message
       })
        res.json(sentEmail);
    }catch(error){
        res.json(error);
    }
})

module.exports={sendEmailMsgCtrl}
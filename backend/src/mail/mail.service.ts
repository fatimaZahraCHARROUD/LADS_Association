import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';


@Injectable()
export class MailService {


private transporter;


constructor(){

    this.transporter = nodemailer.createTransport({

        service:"gmail",

        auth:{
            user:"leaderassociation.contact@gmail.com",
            pass:"lkxjarnguvyqswqq"
        }

    });

}



async sendContactEmail(data:any){

 
    await this.transporter.sendMail({

        from:"leaderassociation.contact@gmail.com",

        to:"fatimazahracharroud92@gmail.com",
        replyTo: data.email,
        subject:"New Contact Message",


        html:`

        <h2>New message</h2>

        <p>
        <b>Name:</b> ${data.fullName}
        </p>


        <p>
        <b>Email:</b> ${data.email}
        </p>


        <p>
        <b>Message:</b> ${data.message}
        </p>

        `

    });

 

}

async sendMembershipRequestEmail(data: any) {

  await this.transporter.sendMail({

    from: "leaderassociation.contact@gmail.com",
    to: "fatimazahracharroud92@gmail.com",

    replyTo: data.email,

    subject: "New Membership Request",

    html: `
      <h2>New Membership Request</h2>

      <p><b>Name:</b> ${data.fullName}</p>
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Phone:</b> ${data.phone}</p>
      <p><b>Message:</b> ${data.motivation}</p>
    `
  });
}

async sendEventRegistrationEmail(data: any) {

  await this.transporter.sendMail({

    from: "leaderassociation.contact@gmail.com",
    to: "fatimazahracharroud92@gmail.com",

    replyTo: data.email,

    subject: `New Event Registration: ${data.eventTitle}`,

    html: `
      <h2>Event Registration</h2>

      <p><b>Name:</b> ${data.fullName}</p>
      <p><b>Email:</b> ${data.email}</p>

   <p><b>Event:</b> ${data.eventTitle}</p>
    <p><b>Date:</b> ${data.eventDate}</p>
    `
  });
}

}
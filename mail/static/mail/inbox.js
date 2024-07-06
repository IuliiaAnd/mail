document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  display_emails(mailbox);
}

function display_emails(mailbox){
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      const message = document.createElement('div');
      message.className = email.read ? 'read' : 'unread';
      message.innerHTML = `
        <div><strong>From:</strong> ${email.sender}</div>
        <div><strong>Subject:</strong> ${email.subject}</div>
        <div class="timestamp">${email.timestamp}</div>
      `;
      document.querySelector('#emails-view').append(message);
      
      message.addEventListener('click', ()=>{     
        view_email(email.id);
      });
      
      if (mailbox !== 'sent'){
        const btn_archive = document.createElement('button');
        btn_archive.className = email.archived ? 'unarchive' : 'archive';
        btn_archive.innerHTML = `${email.archived ? 'Unarchive' : 'Archive'}`;        
        document.querySelector('#emails-view').append(btn_archive);      
  
        btn_archive.addEventListener('click', (event) =>{
          event.stopPropagation();
          if (!email.archived) {
            archive_email(email.id, true);           
          } else {
            archive_email(email.id, false);            
          }
          document.querySelector('#emails-view').innerHTML = '';
          message.remove();                      
        });
      };      
    });    
  });
}

function send_email(event){
  event.preventDefault();

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject:document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value,
    })  
  })
  .then(response => response.json())
  .then(result => {
    load_mailbox('sent'),
    console.log('Message was sent successfuly', result)
  }); 
}

function view_email(id){
  fetch(`emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#emails-view').innerHTML = '';
    console.log(email);

    const message_details = document.createElement('div');
    message_details.className ="view-message";
    message_details.innerHTML =`
      <div><strong>From:</strong> ${email.sender}</div>
      <div><strong>To:</strong> ${email.recipients}</div>
      <div><strong>Subject:</strong> ${email.subject}</div>
      <div><strong>Message:</strong> ${email.body}</div>
      <div><strong>Timestamp:</strong> ${email.timestamp}</div>
    `;
    document.querySelector('#emails-view').append(message_details);

    if (!email.read == true) {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      });
    }

    const btn_reply = document.createElement('button');
    btn_reply.className = "reply-btn";
    btn_reply.innerHTML ="Reply";
    document.querySelector('#emails-view').append(btn_reply);

    btn_reply.addEventListener('click', () => {
      reply_to_email(email);
    });
  })
}

function reply_to_email(email) {
  compose_email();
  document.querySelector('#compose-recipients').value = email.sender;
  
  let subject = email.subject;      
    if(!subject.startsWith("Re: ")){
      subject = "Re: " + subject;      
    }
  document.querySelector('#compose-subject').value = subject; 

  document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote: ${email.body}\n`;  
}

function archive_email(id, archived) {  
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: archived
    })
  })
  .then(response => {
    if (response.ok) {      
      console.log(`Email ${archived ? 'archived' : 'unarchived'} successfully`);
      load_mailbox('inbox');
    } else {
      console.log('Failed to update archive status');
    }
  });
}
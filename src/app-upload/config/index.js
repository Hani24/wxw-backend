// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types

// .xls  Microsoft Excel   application/vnd.ms-excel
// .xlsx   Microsoft Excel (OpenXML)   application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// .doc  Microsoft Word  application/msword
// .docx   Microsoft Word (OpenXML)  application/vnd.openxmlformats-officedocument.wordprocessingml.document
// .txt  Text, (generally ASCII or ISO 8859-n)   text/plain

module.exports = (App, params={})=>{

  return {
    supportedTypes: {
      image: ['image/jpeg','image/jpg','image/png','image/gif','image/svg+xml','image/svg','image/webp'],
      video: ['video/mp4','video/quicktime','video/x-m4v','video/x-flv'],
      audio: ['audio/mpeg','audio/wav','audio/aac','audio/m4a','audio/ogg','audio/mp4','audio/x-aiff'],
      document: [
        'application/pdf', 'text/plain',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],      
    }
  };

}

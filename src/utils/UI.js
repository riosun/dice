const $ = window.$

const UI = {
  showNotice,
  showCommonNotice,
  showAlert,
  hideAlert,
}

function showAlert(type, alertMsg) {
  window.cmd({ type: 'common', alertMsg })
  if (type == 'success') {
    $('#goToMoonAlert')
      .addClass('success')
      .removeClass('error')
      .animate({ bottom: '10px' })
  } else {
    $('#goToMoonAlert')
      .addClass('error')
      .removeClass('success')
      .animate({ bottom: '10px' })
  }
  let t = setTimeout(() => {
    clearTimeout(t)
    hideAlert()
  }, 5000)
}

function hideAlert() {
  $('#goToMoonAlert').animate({ bottom: '-50px' })
}

function showNotice(noticeMsg) {
  window.cmd({ type: 'common', noticeMsg })
  $('#notice-modal').modal('show')
}

function showCommonNotice(noticeTitle, noticeBody) {
  window.cmd({ type: 'common', noticeTitle, noticeBody })
  $('#common-notice-modal').modal('show')
}

export default UI

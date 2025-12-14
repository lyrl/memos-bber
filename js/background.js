chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create(
      {
        type: 'normal',
        title: chrome.i18n.getMessage("sendTo"),
        id: 'Memos-send-selection',
        contexts: ['selection']
      },
    )
    chrome.contextMenus.create(
      {
        type: 'normal',
        title: chrome.i18n.getMessage("sendLinkTo"),
        id: 'Memos-send-link',
        contexts: ['link', 'page']
      },
    )
    chrome.contextMenus.create(
      {
        type: 'normal',
        title: chrome.i18n.getMessage("sendImageTo"),
        id: 'Memos-send-image',
        contexts: ['image']
      },
    )
})
chrome.contextMenus.onClicked.addListener(info => {
    let tempCont=''
    switch(info.menuItemId){
      case 'Memos-send-selection':
        tempCont = info.selectionText + '\n'
        break
      case 'Memos-send-link':
        tempCont = (info.linkUrl || info.pageUrl) + '\n'
        break
      case 'Memos-send-image':
        tempCont = `![](${info.srcUrl})` + '\n'
        break
    }
    chrome.storage.sync.get({open_action: "save_text", open_content: '', save_mode: 'EDIT'}, function(items) {
      if(items.open_action === 'upload_image') {
        alert(chrome.i18n.getMessage("picPending"));
      } else if (items.save_mode === 'DIRECT') {
        // 直接保存模式：立即发送到 Memos
        directSaveToMemos(tempCont);
      } else {
        // 编辑模式：添加到文本框
        chrome.storage.sync.set({open_action: "save_text", open_content: items.open_content + tempCont});
      }
    })
})

// 直接保存到 Memos 的函数
function directSaveToMemos(content) {
  chrome.storage.sync.get({
    apiUrl: '',
    apiTokens: '',
    hidetag: '',
    showtag: '',
    memo_lock: 'PUBLIC'
  }, function(info) {
    if (!info.apiUrl || !info.apiTokens) {
      // 如果没有配置 API，则回退到编辑模式
      chrome.storage.sync.set({open_action: "save_text", open_content: content});
      return;
    }

    var hideTag = info.hidetag
    var showTag = info.showtag
    var nowTag = content.match(/(#[^\s#]+)/)
    var sendvisi = info.memo_lock || 'PUBLIC'
    if(nowTag){
      if(nowTag[1] == showTag){
        sendvisi = 'PUBLIC'
      }else if(nowTag[1] == hideTag){
        sendvisi = 'PRIVATE'
      }
    }

    // 发送到 Memos API
    fetch(info.apiUrl + 'api/v1/memos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + info.apiTokens
      },
      body: JSON.stringify({
        'content': content,
        'visibility': sendvisi
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.name) {
        // 保存成功，显示通知
        const successMessage = chrome.i18n.getMessage("memoDirectSuccess") || '内容已成功保存到 Memos!';
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/logo_24x24.png',
          title: 'Memos',
          message: successMessage
        });
        
        // 在页面上也显示通知
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'SHOW_PAGE_NOTIFICATION',
              text: successMessage,
              notificationType: 'success'
            });
          }
        });
      } else {
        // 保存失败，回退到编辑模式
        chrome.storage.sync.set({open_action: "save_text", open_content: content});
        const failedMessage = chrome.i18n.getMessage("memoDirectFailed") || '保存失败，已添加到编辑器中';
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/logo_24x24.png',
          title: 'Memos',
          message: failedMessage
        });
        
        // 在页面上也显示失败通知
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'SHOW_PAGE_NOTIFICATION',
              text: failedMessage,
              notificationType: 'error'
            });
          }
        });
      }
    })
    .catch(error => {
      console.error('Direct save error:', error);
      // 发生错误，回退到编辑模式
      chrome.storage.sync.set({open_action: "save_text", open_content: content});
      const errorMessage = chrome.i18n.getMessage("memoDirectFailed") || '保存失败，已添加到编辑器中';
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/logo_24x24.png',
        title: 'Memos',
        message: errorMessage
      });
      
      // 在页面上也显示错误通知
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'SHOW_PAGE_NOTIFICATION',
            text: errorMessage,
            notificationType: 'error'
          });
        }
      });
    });
  });
}
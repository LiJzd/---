// 存储批注数据
let annotations = {};
const currentUrl = window.location.href;

// 加载已保存的批注
chrome.storage.local.get([currentUrl], (result) => {
  annotations = result[currentUrl] || {};
  restoreAnnotations();
});

// 监听文本选择
document.addEventListener('mouseup', handleTextSelection);

function handleTextSelection(e) {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (selectedText.length === 0) return;
  
  // 创建批注按钮
  const existingBtn = document.getElementById('annotation-btn');
  if (existingBtn) existingBtn.remove();
  
  const btn = document.createElement('button');
  btn.id = 'annotation-btn';
  btn.textContent = '📝 添加批注';
  btn.className = 'annotation-button';
  
  // 定位按钮
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  btn.style.position = 'fixed';
  btn.style.left = `${rect.left + window.scrollX}px`;
  btn.style.top = `${rect.bottom + window.scrollY + 5}px`;
  btn.style.zIndex = '10000';
  
  btn.onclick = () => showAnnotationDialog(selectedText, range);
  
  document.body.appendChild(btn);
  
  // 点击其他地方时移除按钮
  setTimeout(() => {
    document.addEventListener('click', function removeBtn(e) {
      if (e.target !== btn) {
        btn.remove();
        document.removeEventListener('click', removeBtn);
      }
    });
  }, 100);
}

function showAnnotationDialog(selectedText, range) {
  const dialog = document.createElement('div');
  dialog.className = 'annotation-dialog';
  dialog.innerHTML = `
    <div class="annotation-dialog-content">
      <h3>添加批注</h3>
      <p><strong>选中文字：</strong>${selectedText}</p>
      <textarea id="annotation-input" placeholder="输入你的批注..."></textarea>
      <div class="annotation-dialog-buttons">
        <button id="save-annotation">保存</button>
        <button id="cancel-annotation">取消</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  const textarea = dialog.querySelector('#annotation-input');
  textarea.focus();
  
  dialog.querySelector('#save-annotation').onclick = () => {
    const note = textarea.value.trim();
    if (note) {
      saveAnnotation(selectedText, note, range);
    }
    dialog.remove();
    document.getElementById('annotation-btn')?.remove();
  };
  
  dialog.querySelector('#cancel-annotation').onclick = () => {
    dialog.remove();
  };
}

function saveAnnotation(text, note, range) {
  const id = Date.now().toString();
  
  // 高亮选中的文字
  const span = document.createElement('span');
  span.className = 'annotated-text';
  span.dataset.annotationId = id;
  span.title = note;
  
  try {
    range.surroundContents(span);
  } catch (e) {
    // 如果无法包裹（跨元素选择），使用简单方式
    span.textContent = text;
    range.deleteContents();
    range.insertNode(span);
  }
  
  // 添加点击事件显示批注
  span.onclick = (e) => {
    e.stopPropagation();
    showAnnotationPopup(span, note, id);
  };
  
  // 保存到存储
  annotations[id] = { text, note, html: span.outerHTML };
  chrome.storage.local.set({ [currentUrl]: annotations });
}

function showAnnotationPopup(element, note, id) {
  // 移除已存在的弹窗
  document.querySelectorAll('.annotation-popup').forEach(p => p.remove());
  
  const popup = document.createElement('div');
  popup.className = 'annotation-popup';
  popup.innerHTML = `
    <div class="annotation-popup-content">
      <p>${note}</p>
      <button class="delete-annotation" data-id="${id}">删除批注</button>
    </div>
  `;
  
  const rect = element.getBoundingClientRect();
  popup.style.position = 'fixed';
  popup.style.left = `${rect.left}px`;
  popup.style.top = `${rect.bottom + 5}px`;
  popup.style.zIndex = '10001';
  
  document.body.appendChild(popup);
  
  popup.querySelector('.delete-annotation').onclick = () => {
    deleteAnnotation(id, element);
    popup.remove();
  };
  
  // 点击其他地方关闭弹窗
  setTimeout(() => {
    document.addEventListener('click', function closePopup(e) {
      if (!popup.contains(e.target) && e.target !== element) {
        popup.remove();
        document.removeEventListener('click', closePopup);
      }
    });
  }, 100);
}

function deleteAnnotation(id, element) {
  // 移除高亮
  const text = element.textContent;
  const textNode = document.createTextNode(text);
  element.parentNode.replaceChild(textNode, element);
  
  // 从存储中删除
  delete annotations[id];
  chrome.storage.local.set({ [currentUrl]: annotations });
}

function restoreAnnotations() {
  // 页面加载时恢复批注（简化版本）
  // 实际使用中可能需要更复杂的定位逻辑
  Object.entries(annotations).forEach(([id, data]) => {
    // 这里可以添加更复杂的恢复逻辑
  });
}

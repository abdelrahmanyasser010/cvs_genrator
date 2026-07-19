const fs = require('fs');
let s = fs.readFileSync('app/assets/editor.js', 'utf8').replace(/\r\n/g, '\n');

const target = `    exportPdf, exportJson, exportHtml, exportPng, exportDocx,
    switchCoachTab,
  };
})();`;

const replacement = `    exportPdf, exportJson, exportHtml, exportPng, exportDocx,
    switchCoachTab, triggerSmartFix, applyJDMatch, clearJDMatch,
    addKeywordWithConfirm, confirmAddKeyword, cancelAddKeyword,
    showVersionManagerModal, closeVersionManager, handleCreateVersion, handleSwitchVersion, handleDeleteVersion,
    showMobMenu, setMobileView
  };
})();`;

if (s.includes(target)) {
  s = s.replace(target, replacement);
  fs.writeFileSync('app/assets/editor.js', s, 'utf8');
  console.log('Successfully updated Editor exports.');
} else {
  console.error('Target not found in editor.js');
}

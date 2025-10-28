export const TARGET_PAGE_IDS = ["me", "beatmaps", "recent_activity", "top_ranks", "medals", "historical", "kudosu"] as const

export const CHEVRON_ICONS = {
    DOWN: '<path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, 1)"/>',
    UP: '<path d="M4 10L8 6L12 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, -1)"/>',
} as const

export const STORAGE_KEYS = {
    COLLAPSED: "opfphider-collapsed-states",
    REMOVED: "opfphider-remove-states",
    LANGUAGE: "opfphider-language",
} as const

export const I18N = {
    en: {
        collapseDescription: "Pages collapsed by default",
        removeDescription: "Pages hidden completely",
        save: "Save",
        cancel: "Cancel",
        refreshNotification: "Settings saved! Changes to removed pages require a page refresh to take effect.",
    },
    "zh-CN": {
        collapseDescription: "默认收起的模块",
        removeDescription: "直接隐藏的模块",
        save: "保存",
        cancel: "取消",
        refreshNotification: "设置已保存！删除页面的更改需要刷新页面才能生效。",
    },
    ja: {
        collapseDescription: "デフォルトで折りたたむモジュール",
        removeDescription: "完全に非表示にするモジュール",
        save: "保存",
        cancel: "キャンセル",
        refreshNotification: "設定を保存しました！削除したページの変更を反映するにはページを更新してください。",
    },
    ko: {
        collapseDescription: "기본적으로 접힌 모듈",
        removeDescription: "완전히 숨기는 모듈",
        save: "저장",
        cancel: "취소",
        refreshNotification: "설정이 저장되었습니다! 삭제된 페이지 변경사항을 적용하려면 페이지를 새로고침해야 합니다.",
    },
    ru: {
        // cSpell:disable
        collapseDescription: "Модули, свёрнутые по умолчанию",
        removeDescription: "Модули, полностью скрытые",
        save: "Сохранить",
        cancel: "Отмена",
        refreshNotification: "Настройки сохранены! Для применения изменений к удалённым страницам требуется перезагрузка страницы.",
    }, // cSpell:enable
} as const

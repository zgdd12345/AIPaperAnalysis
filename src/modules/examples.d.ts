export declare class BasicExampleFactory {
    static registerNotifier(): void;
    static exampleNotifierCallback(): void;
    private static unregisterNotifier;
    static registerPrefs(): void;
}
export declare class KeyExampleFactory {
    static registerShortcuts(): void;
    static exampleShortcutLargerCallback(): void;
    static exampleShortcutSmallerCallback(): void;
}
export declare class UIExampleFactory {
    static registerStyleSheet(win: _ZoteroTypes.MainWindow): void;
    static registerRightClickMenuItem(): void;
    static registerRightClickMenuPopup(win: Window): void;
    static registerWindowMenuWithSeparator(): void;
    static registerExtraColumn(): Promise<void>;
    static registerExtraColumnWithCustomCell(): Promise<void>;
    static registerItemPaneCustomInfoRow(): void;
    static registerItemPaneSection(): void;
    static registerReaderItemPaneSection(): Promise<void>;
}
export declare class PromptExampleFactory {
    static registerNormalCommandExample(): void;
    static registerAnonymousCommandExample(window: Window): void;
    static registerConditionalCommandExample(): void;
}
export declare class HelperExampleFactory {
    static dialogExample(): Promise<void>;
    static clipboardExample(): void;
    static filePickerExample(): Promise<void>;
    static progressWindowExample(): void;
    static vtableExample(): void;
}

declare const _globalThis: {
  [key: string]: any;
  Zotero: _ZoteroTypes.Zotero;
  ztoolkit: ZToolkit;
  addon: typeof addon;
};

declare type ZToolkit = ReturnType<
  typeof import("../src/utils/ztoolkit").createZToolkit
>;

declare const ztoolkit: ZToolkit;

declare const rootURI: string;

declare const addon: import("../src/addon").default;

declare const __env__: "production" | "development";

declare namespace XUL {
  interface Element extends HTMLElement {}

  interface MenuList extends Element {
    value: string;
    addEventListener(type: string, listener: (event: Event) => void): void;
  }

  interface Checkbox extends Element {
    checked: boolean;
    addEventListener(type: string, listener: (event: Event) => void): void;
  }

  interface Scale extends Element {
    value: number;
    addEventListener(type: string, listener: (event: Event) => void): void;
  }
}

declare namespace Zotero {
  interface FilePickerStatic {
    saveFile(
      title: string,
      defaultName: string,
      filters?: string[],
    ): Promise<string | null>;
    openFile(title: string, filters?: string[]): Promise<string | null>;
  }

  const FilePicker: FilePickerStatic;
}

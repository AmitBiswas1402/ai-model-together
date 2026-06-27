export function getCleanDesignHtml(root: HTMLElement): string {
  const clone = root.cloneNode(true) as HTMLElement;

  clone.querySelectorAll<HTMLElement>("*").forEach((el) => {
    el.style.outline = "";
    el.style.cursor = "";
    el.removeAttribute("contenteditable");
  });

  return clone.innerHTML;
}

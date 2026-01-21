export function addTreeParent<T extends { children?: T[]; parent?: T }>(data: T[]) {
  const list: T[] = [...data]
  for (let e of list) {
    if (e.children?.length) {
      for (let child of e.children) {
        child.parent = e
      }
      list.push(...e.children)
    }
  }
  return data
}

export function filterTree<
  T extends { id?: number; disabled?: boolean; children?: any[]; parent?: any }
>(data: T[], id: number) {
  traverseTree<T>(data, (e) => {
    e.disabled = e.id === id
  })
}

export function traverseTree<T extends { children?: any[] }>(
  data: T[],
  callback: (item: T) => void
) {
  const list: T[] = [...data]
  for (let e of list) {
    if (e.children?.length) {
      list.push(...e.children)
    }
    callback(e)
  }
}

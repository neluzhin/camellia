import {
  Bookmark, BookmarkRootCategory, Folder, Link,
} from './Bookmark';

const normalizeBookmarkFromBrowserBookmark = (bookmark: browser.bookmarks.BookmarkTreeNode, nestingLevel: number): Bookmark => {
  if (bookmark.url !== undefined) {
    return new Link(
      bookmark.id,
      bookmark.title,
      nestingLevel,
      bookmark.url,
    );
  }

  const children = (bookmark.children || []).map((child) => normalizeBookmarkFromBrowserBookmark(child, nestingLevel + 1));

  if (bookmark.parentId === undefined) {
    return new BookmarkRootCategory(
      bookmark.id,
      bookmark.title,
      nestingLevel,
      children,
    );
  }

  return new Folder(
    bookmark.id,
    bookmark.title,
    nestingLevel,
    children,
  );
};

export const getTree = async (): Promise<BookmarkRootCategory[]> => {
  let bookmarks: Bookmark[];

  if (chrome !== undefined && chrome.bookmarks !== undefined) {
    bookmarks = await new Promise((resolve) => chrome.bookmarks.getTree((data) => {
      resolve((data[0].children || [])
        .map((bookmark) => normalizeBookmarkFromBrowserBookmark(bookmark, 0)));
    }));
  } else {
    bookmarks = ((await browser.bookmarks.getTree())[0].children || [])
      .map((bookmark) => normalizeBookmarkFromBrowserBookmark(bookmark, 0));
  }

  return bookmarks as BookmarkRootCategory[];
};

export const openBookmarkManager = async (): Promise<void> => {
  if (chrome === undefined || chrome.tabs === undefined) {
    throw Error('This browser does not have bookmark manager.');
  }

  return new Promise((resolve) => chrome.tabs.create({
    url: 'chrome://bookmarks',
  }, () => resolve()));
};

export const search = async (query: string): Promise<Link[]> => {
  let bookmarks: Bookmark[];

  if (chrome !== undefined && chrome.bookmarks !== undefined) {
    bookmarks = await new Promise((resolve) => chrome.bookmarks.search(query, (data) => {
      resolve(data.map((bookmark) => normalizeBookmarkFromBrowserBookmark(bookmark, 0)));
    }));
  } else {
    bookmarks = (await browser.bookmarks.search(query))
      .map((bookmark) => normalizeBookmarkFromBrowserBookmark(bookmark, 0));
  }

  return bookmarks.filter((bookmark) => bookmark instanceof Link) as Link[];
};

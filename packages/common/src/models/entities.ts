export interface User {
  id: string;
  email: string;
  passwordHash: string;
  wrappedUMK: Buffer;
  salt: Buffer;
  argon2Params: {
    m: number;
    t: number;
    p: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  ownerId: string;
  titleCt: Buffer;
  bodyCt: Buffer;
  ivTitle: Buffer;
  ivBody: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteTerm {
  noteId: string;
  termHash: Buffer;
}

export interface Tag {
  id: string;
  ownerId: string;
  tagCt: Buffer;
  ivTag: Buffer;
  createdAt: Date;
}

export interface NoteTag {
  noteId: string;
  tagId: string;
}

export interface TagTerm {
  tagId: string;
  termHash: Buffer;
}
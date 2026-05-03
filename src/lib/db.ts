import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    writeJSON(filename, defaultValue);
    return defaultValue;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

function writeJSON<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === 'EROFS' || code === 'EACCES') {
      throw new Error(
        'Sistema de arquivos somente leitura. Este app usa banco de dados em arquivo JSON e não é compatível com ambientes sem disco gravável (ex: Vercel Serverless). Execute localmente com "npm run dev".'
      );
    }
    throw e;
  }
}

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'student';
  createdAt: string;
  enrolledCourses: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  createdAt: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  order: number;
  theory: {
    videoUrl: string;
    videoType: 'youtube' | 'vimeo';
    duration: number; // in seconds
    description: string;
  };
  practice: {
    videoUrl: string;
    videoType: 'youtube' | 'vimeo';
    duration: number;
    description: string;
  };
  quiz: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface StudentProgress {
  userId: string;
  courseId: string;
  lessonId: string;
  theoryCompleted: boolean;
  theoryWatchedSeconds: number;
  practiceCompleted: boolean;
  practiceWatchedSeconds: number;
  quizScore: number | null;
  quizPassed: boolean;
  completedAt: string | null;
}

// DB operations
export const db = {
  users: {
    getAll: (): User[] => readJSON<User[]>('users.json', []),
    findById: (id: string): User | undefined => {
      return db.users.getAll().find(u => u.id === id);
    },
    findByEmail: (email: string): User | undefined => {
      return db.users.getAll().find(u => u.email === email);
    },
    create: (user: User): User => {
      const users = db.users.getAll();
      users.push(user);
      writeJSON('users.json', users);
      return user;
    },
    update: (id: string, data: Partial<User>): User | null => {
      const users = db.users.getAll();
      const index = users.findIndex(u => u.id === id);
      if (index === -1) return null;
      users[index] = { ...users[index], ...data };
      writeJSON('users.json', users);
      return users[index];
    },
    delete: (id: string): boolean => {
      const users = db.users.getAll();
      const filtered = users.filter(u => u.id !== id);
      if (filtered.length === users.length) return false;
      writeJSON('users.json', filtered);
      return true;
    },
  },
  courses: {
    getAll: (): Course[] => readJSON<Course[]>('courses.json', []),
    findById: (id: string): Course | undefined => {
      return db.courses.getAll().find(c => c.id === id);
    },
    create: (course: Course): Course => {
      const courses = db.courses.getAll();
      courses.push(course);
      writeJSON('courses.json', courses);
      return course;
    },
    update: (id: string, data: Partial<Course>): Course | null => {
      const courses = db.courses.getAll();
      const index = courses.findIndex(c => c.id === id);
      if (index === -1) return null;
      courses[index] = { ...courses[index], ...data };
      writeJSON('courses.json', courses);
      return courses[index];
    },
    delete: (id: string): boolean => {
      const courses = db.courses.getAll();
      const filtered = courses.filter(c => c.id !== id);
      if (filtered.length === courses.length) return false;
      writeJSON('courses.json', filtered);
      return true;
    },
  },
  progress: {
    getAll: (): StudentProgress[] => readJSON<StudentProgress[]>('progress.json', []),
    findByUserAndCourse: (userId: string, courseId: string): StudentProgress[] => {
      return db.progress.getAll().filter(p => p.userId === userId && p.courseId === courseId);
    },
    findByUserCourseLesson: (userId: string, courseId: string, lessonId: string): StudentProgress | undefined => {
      return db.progress.getAll().find(
        p => p.userId === userId && p.courseId === courseId && p.lessonId === lessonId
      );
    },
    upsert: (progress: StudentProgress): StudentProgress => {
      const all = db.progress.getAll();
      const index = all.findIndex(
        p => p.userId === progress.userId && p.courseId === progress.courseId && p.lessonId === progress.lessonId
      );
      if (index === -1) {
        all.push(progress);
      } else {
        all[index] = { ...all[index], ...progress };
      }
      writeJSON('progress.json', all);
      return progress;
    },
  },
};

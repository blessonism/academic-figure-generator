import { create } from 'zustand';

export interface Project {
    id: number;
    name: string;
    description: string | null;
    paper_field: string;
    color_scheme: string;
    status: string;
    created_at: string;
    document_count: number;
    prompt_count: number;
    image_count: number;
}

export type ProjectProgressSummary = {
    label: string;
    detail: string;
};

export function getProjectProgressSummary(project: Pick<Project, 'document_count' | 'prompt_count' | 'image_count'>): ProjectProgressSummary {
    const documentCount = project.document_count ?? 0;
    const promptCount = project.prompt_count ?? 0;
    const imageCount = project.image_count ?? 0;

    if (documentCount === 0) {
        return {
            label: '待上传文档',
            detail: '先上传论文并完成解析，Studio 才能进入后续创作阶段。',
        };
    }

    if (promptCount === 0) {
        return {
            label: '待确认范围',
            detail: '文档已就绪，下一步确认章节范围并生成草案。',
        };
    }

    if (imageCount === 0) {
        return {
            label: '待生成配图',
            detail: '草案已经准备好，可以进入 Render 阶段批量出图。',
        };
    }

    return {
        label: '待精修',
        detail: '已有生成结果，进入 Review 阶段完成精修、定稿和下载。',
    };
}

interface ProjectState {
    currentProject: Project | null;
    projects: Project[];
    setCurrentProject: (project: Project | null) => void;
    setProjects: (projects: Project[]) => void;
    clearState: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
    currentProject: null,
    projects: [],
    setCurrentProject: (project) => set({ currentProject: project }),
    setProjects: (projects) => set({ projects }),
    clearState: () => set({ currentProject: null, projects: [] })
}));

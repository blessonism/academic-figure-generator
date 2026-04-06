import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { render, screen, userEvent } from '@/test/render';
import { StudioDemoV2Page } from '@/pages/StudioDemoV2Page';

describe('StudioDemoV2Page', () => {
  it('默认展示更细粒度的 Scope 工作台', () => {
    render(
      <MemoryRouter initialEntries={['/studio-demo-v2']}>
        <Routes>
          <Route path="/studio-demo-v2" element={<StudioDemoV2Page />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Studio Demo V2')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '输入来源确认' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '推荐范围' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '手动微调' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '范围摘要' })).toBeInTheDocument();
  });

  it('切换到 Prompt 阶段后展示更专业的评审面板', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/studio-demo-v2']}>
        <Routes>
          <Route path="/studio-demo-v2" element={<StudioDemoV2Page />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Prompt 评审/ }));

    expect(screen.getByRole('heading', { name: '候选草案池' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '用途标签' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '风险提示' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '保留集' })).toBeInTheDocument();
  });

  it('在 Render 阶段可以修改输出规格并提交确认', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/studio-demo-v2']}>
        <Routes>
          <Route path="/studio-demo-v2" element={<StudioDemoV2Page />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Render 提交/ }));
    await user.click(screen.getByRole('button', { name: '切换到 4K 规格' }));

    expect(screen.getByText('当前规格：4K')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '提交生成确认' }));

    expect(screen.getByText('提交清单已确认')).toBeInTheDocument();
  });
});

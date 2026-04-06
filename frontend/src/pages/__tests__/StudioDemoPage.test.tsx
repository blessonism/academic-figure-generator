import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { render, screen, userEvent } from '@/test/render';
import { StudioDemoPage } from '@/pages/StudioDemoPage';

describe('StudioDemoPage', () => {
  it('默认展示范围确认阶段', () => {
    render(
      <MemoryRouter initialEntries={['/studio-demo']}>
        <Routes>
          <Route path="/studio-demo" element={<StudioDemoPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Studio Demo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '范围确认' })).toBeInTheDocument();
    expect(screen.getByText('确认这次用于生成配图的论文范围')).toBeInTheDocument();
  });

  it('点击阶段导航后切换到 Prompt 阶段并更新上下文摘要', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/studio-demo']}>
        <Routes>
          <Route path="/studio-demo" element={<StudioDemoPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Prompt 草案/i }));

    expect(screen.getByRole('heading', { name: 'Prompt 草案' })).toBeInTheDocument();
    expect(screen.getByText('筛选值得继续出图的候选草案')).toBeInTheDocument();
    expect(screen.getByText('当前阶段摘要')).toBeInTheDocument();
    expect(screen.getByText(/已接受草案/)).toBeInTheDocument();
  });

  it('修改草案决策后显示底部动作条，保存后动作条消失', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/studio-demo']}>
        <Routes>
          <Route path="/studio-demo" element={<StudioDemoPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Prompt 草案/i }));
    await user.click(screen.getByRole('button', { name: '接受草案 01' }));

    expect(screen.getByText('你有未保存的草案决策')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '保存草案决策' }));

    expect(screen.queryByText('你有未保存的草案决策')).not.toBeInTheDocument();
    expect(screen.getByText('草案决策已保存')).toBeInTheDocument();
  });
});

import dynamic from 'dva/dynamic';

// wrapper of dynamic
const dynamicWrapper = (app, models, component) => dynamic({
  app,
  models: () => models.map(m => import(`../models/${m}.js`)),
  component,
});

// nav data
export const getNavData = app => [
  {
    component: dynamicWrapper(app, ['user'], () => import('../layouts/BasicLayout')),
    layout: 'BasicLayout',
    path: '/',
    children: [
      {
        name: '仪表盘',
        icon: 'dashboard',
        path: 'dashboard',
        component: dynamicWrapper(app, ['user'], () => import('../routes/Dashboard')),
      },
      {
        name: 'demo',
        icon: 'dashboard',
        path: 'demo',
        component: dynamicWrapper(app, ['rule'], () => import('../routes/List/TableList')),
      },
    ],
  },
];


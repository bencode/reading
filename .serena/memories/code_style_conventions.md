# Code Style and Conventions

## General Principles (from CLAUDE.md)
- 偏好函数式编程风格 (Prefer functional programming style)
- 保持代码简洁：文件长度 <200行，函数长度 <40行
- 不加没必要的try/catch
- 只写必要的注释
- 注释不要重复代码

## TypeScript/JavaScript
- **Imports**: 从外部到内部，由远至近地import (external to internal, far to near)
- **Types**: prefer type over interface
- **Exports**: prefer named export over default export
- **Control Flow**: 不使用switch/case语句
- **Type Imports**: 使用 import type 或 import {type xxx}

## File Organization
- 被引用的小组件(<20行)可以放在同一文件中
- 模块要小，每个文件不超过200行
- 功能性函数不超过一屏(40行之内)

## Error Handling
- 不隐藏异常，如无必要不用try/catch
- 如没有抛出异常，至少要输出日志

## Code Quality
- 完成小功能且正常工作后及时commit
- 在下一个新功能开始前及时重构
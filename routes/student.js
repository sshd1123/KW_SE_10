const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const { asyncErrorCatcher } = require('../middlewares/error');
const AppError = require('../utils/AppError');

// 졸업 요건 정의
const GRADUATION_REQUIREMENTS = {
  TOTAL_CREDITS: 100, // 학점 100
  BASIC_LIBERAL_ARTS_CREDITS: 30, // 기초교양 30학점
  TOPCIT_EXAM_REQUIRED: true, // TODO: 실제 TOPCIT 응시 여부 확인 로직 구현 시 이 값 사용
  GRADUATION_PROJECT_REQUIRED: true, // TODO: 실제 졸업 작품 발표 여부 확인 로직 구현 시 이 값 사용
};

// TODO: 학생 졸업 요건 열람 기능 구현
// TODO: 학생 졸업 요건 관련 DB 추가 (기초교양/세부전공 구분 컬럼, 탑싯/졸업작품 완료 여부 컬럼 등)
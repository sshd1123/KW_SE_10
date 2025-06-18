# 데이터베이스 스키마 참조 문서

이 문서는 school_db 데이터베이스의 모든 테이블 구조와 컬럼명을 정리한 참조 문서입니다.
SQL 쿼리 작성 시 반드시 이 문서를 참조하여 정확한 컬럼명을 사용하세요.

## 📋 테이블 목록

### 1. `tb_users` 테이블
**사용자 기본 정보**
```sql
- user_id INT (PRIMARY KEY)
- login_id VARCHAR(50)
- password_hash VARCHAR(255)
- role ENUM(...)
- username VARCHAR(...)
```

### 2. `tb_students` 테이블
**학생 정보**
```sql
- student_id INT (PRIMARY KEY)
- student_name VARCHAR(100)  ⚠️ NOT 'name'
- birth_date DATE            ⚠️ NOT 'admission_year'
- dept_id INT
- email VARCHAR(100)
- user_id INT (FOREIGN KEY → tb_users.user_id)
```

### 3. `tb_professors` 테이블
**교수 정보**
```sql
- professor_id INT (PRIMARY KEY)
- professor_name VARCHAR(100)  ⚠️ NOT 'name'
- dept_id INT
- email VARCHAR(100)
- user_id INT (FOREIGN KEY → tb_users.user_id)
```

### 4. `tb_departments` 테이블
**학과 정보**
```sql
- dept_id INT (PRIMARY KEY)
- dept_name VARCHAR(200)     ⚠️ NOT 'department_name'
- college_id INT
- parent_dept_id INT
- dept_type ENUM('day', 'night', ...)
```

### 5. `tb_course` 테이블
**강의 정보**
```sql
- course_id INT (PRIMARY KEY)
- course_code VARCHAR(20)
- course_name VARCHAR(100)
- course_type VARCHAR(10)
- credits INT
- hours INT
- professor_name VARCHAR(50)
- lecture_time VARCHAR(50)   ⚠️ NOT 'course_time'
- remarks VARCHAR(100)       ⚠️ NOT 'classroom' or 'room'
- semester VARCHAR(10)
- dept_name VARCHAR(100)
- dept_id INT
- college_id INT
```

### 6. `tb_enrollments` 테이블
**수강 신청 정보**
```sql
- enrollment_id INT (PRIMARY KEY)
- student_id INT (FOREIGN KEY → tb_students.student_id)
- course_id INT (FOREIGN KEY → tb_course.course_id)
- enroll_date DATETIME
- status ENUM(...)
- offering_id INT
```

### 7. `tb_colleges` 테이블
**대학 정보**
```sql
- college_id INT (PRIMARY KEY)
- college_name VARCHAR(100)
```

### 8. `tb_grades` 테이블
**성적 정보**
```sql
- grade_id INT (PRIMARY KEY)
- enrollment_id INT (FOREIGN KEY → tb_enrollments.enrollment_id)
- grade VARCHAR(...)
```

## ⚠️ 주의사항 - 자주 실수하는 컬럼명

### 학생 테이블 (`tb_students`)
- ❌ `name` → ✅ `student_name`
- ❌ `admission_year` → ✅ `birth_date`

### 교수 테이블 (`tb_professors`)
- ❌ `name` → ✅ `professor_name`

### 학과 테이블 (`tb_departments`)
- ❌ `department_name` → ✅ `dept_name`

### 강의 테이블 (`tb_course`)
- ❌ `course_time` → ✅ `lecture_time`
- ❌ `classroom` → ✅ `remarks` (강의실 정보는 remarks에 포함)
- ❌ `room` → ✅ `remarks`

## 🔧 올바른 JOIN 쿼리 예시

### 학생 정보 + 학과 정보
```sql
SELECT 
  s.student_id,
  s.student_name,     -- NOT s.name
  s.birth_date,       -- NOT s.admission_year
  d.dept_name         -- NOT d.department_name
FROM tb_students s
LEFT JOIN tb_departments d ON s.dept_id = d.dept_id
WHERE s.user_id = ?
```

### 수강 강의 조회
```sql
SELECT 
  c.course_id,
  c.course_name,
  c.credits,
  c.lecture_time,     -- NOT c.course_time
  c.remarks,          -- NOT c.classroom or c.room
  c.professor_name
FROM tb_enrollments e
JOIN tb_course c ON e.course_id = c.course_id
WHERE e.student_id = ? AND e.status = 'enrolled'
```

### 교수 정보 + 학과 정보
```sql
SELECT 
  p.professor_id,
  p.professor_name,   -- NOT p.name
  d.dept_name         -- NOT d.department_name
FROM tb_professors p
LEFT JOIN tb_departments d ON p.dept_id = d.dept_id
WHERE p.user_id = ?
```

## 📝 업데이트 로그
- 2024-06-18: 초기 문서 작성
- 스키마 이미지 기준으로 모든 컬럼명 정리 완료

---
⚡ **중요**: SQL 쿼리 작성 전에 반드시 이 문서를 확인하여 정확한 컬럼명을 사용하세요! 


// ====================== 验证模块 ======================
export function validatePermutations<T>(
    from: T[],
    to: T[],
): void {
    // 长度一致性检查
    if (from.length !== to.length) {
        throw new Error(`排列长度不一致 (${from.length} vs ${to.length})`);
    }


    // 构建元素索引映射
    const indexMap = new Map<T, number>();
    from.forEach((elem, index) => {
        if (indexMap.has(elem)) {
            throw new Error(`检测到重复元素: ${elem}`);
        }
        indexMap.set(elem, index);
    });

    // 目标元素存在性检查
    to.forEach(elem => {
        if (!indexMap.has(elem)) {
            throw new Error(`发现未知元素: ${elem}`);
        }
    });
}

// ==================== 核心算法模块 ====================
function computeLehmerCode(permutation: number[]): bigint {
    let result = 0n;
    let factorial = 1n;

    for (let offset = 1; offset < permutation.length; offset++) {
        factorial *= BigInt(offset);
        const currentPos = permutation.length - 1 - offset;
        const currentVal = permutation[currentPos];

        // 统计右侧更小元素的数量
        const smallerCount = permutation.slice(currentPos)
            .filter(v => v < currentVal).length;

        result += factorial * BigInt(smallerCount);
    }

    return result;
}

// ==================== 主入口函数 ====================
export function calcLehmer(
    from: string[],
    to: string[],
): bigint {
    // 参数校验阶段
    validatePermutations(from, to);

    // 生成索引排列（已通过校验，可安全转换）
    const permutation = to.map(elem =>
        from.indexOf(elem) // 由于已经过校验，indexOf不会返回-1
    );

    // 执行核心计算
    return computeLehmerCode(permutation);
}
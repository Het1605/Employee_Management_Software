
from decimal import Decimal

def get_monthly_allocation(total_days: int, month_index: int) -> Decimal:
    base = int(total_days) // 12
    extra = int(total_days) % 12
    
    alloc = base
    if 1 <= month_index <= extra:
        alloc += 1
        
    return Decimal(str(alloc))

def test_allocation(total_days: int):
    allocs = [get_monthly_allocation(total_days, m) for m in range(1, 13)]
    total = sum(allocs)
    print(f"Total Days: {total_days}")
    print(f"Allocations: {[float(a) for a in allocs]}")
    print(f"Sum: {total}")
    assert total == total_days, f"Sum mismatch: {total} != {total_days}"

print("--- Testing PL=9 ---")
test_allocation(9)

print("\n--- Testing CL=15 ---")
test_allocation(15)

print("\n--- Testing SL=12 ---")
test_allocation(12)

print("\n--- Testing 7 days ---")
test_allocation(7)

print("\n--- Testing 30 days ---")
test_allocation(30)

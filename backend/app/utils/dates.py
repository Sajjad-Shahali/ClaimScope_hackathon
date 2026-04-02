from datetime import date, timedelta


def comparable_previous_period(start_date: date, end_date: date) -> tuple[date, date]:
    """Return the immediately preceding period with the same duration."""
    delta = end_date - start_date
    prev_end = start_date - timedelta(days=1)
    prev_start = prev_end - delta
    return prev_start, prev_end
